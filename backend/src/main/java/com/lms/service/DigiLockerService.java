package com.lms.service;

import com.lms.entity.Student;
import com.lms.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * DigiLockerService — implements the full OAuth 2.0 Authorization Code flow
 * for DigiLocker API (Government of India official document wallet).
 *
 * Flow:
 * 1. generateAuthUrl(userId)  → builds authorization URL with CSRF state token
 * 2. handleCallback(code, state, frontendBaseUrl)  → exchanges code, fetches
 *    Aadhaar document, uploads to Cloudinary, marks student as verified
 *
 * To use this in production, register your organization at:
 *   https://api.digitallocker.gov.in/public/oauth2/1/authorize
 * and set these environment variables:
 *   DIGILOCKER_CLIENT_ID
 *   DIGILOCKER_CLIENT_SECRET
 *   DIGILOCKER_REDIRECT_URI   (must match your registered redirect URI exactly)
 *   FRONTEND_BASE_URL         (e.g. https://your-app.vercel.app)
 */
@Service
public class DigiLockerService {

    private static final String DIGILOCKER_AUTH_URL  = "https://api.digitallocker.gov.in/public/oauth2/1/authorize";
    private static final String DIGILOCKER_TOKEN_URL = "https://api.digitallocker.gov.in/public/oauth2/1/token";
    // Aadhaar eKYC XML endpoint
    private static final String DIGILOCKER_AADHAAR_URL = "https://api.digitallocker.gov.in/public/oauth2/3/xml/in.gov.uidai.aadhaar";

    @Value("${digilocker.client-id:}")
    private String clientId;

    @Value("${digilocker.client-secret:}")
    private String clientSecret;

    @Value("${digilocker.redirect-uri:}")
    private String redirectUri;

    @Value("${frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    // In-memory CSRF state store: state-token → userId
    // State tokens are single-use (removed on callback).
    // For multi-instance deployments, replace with Redis/DB-backed store.
    private final ConcurrentHashMap<String, Long> stateStore = new ConcurrentHashMap<>();

    private final StudentRepository studentRepository;
    private final CloudinaryService cloudinaryService;
    private final RestTemplate restTemplate = new RestTemplate();

    public DigiLockerService(StudentRepository studentRepository,
                             CloudinaryService cloudinaryService) {
        this.studentRepository = studentRepository;
        this.cloudinaryService = cloudinaryService;
    }

    /** Returns true if DigiLocker credentials are configured in environment. */
    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
            && clientSecret != null && !clientSecret.isBlank()
            && redirectUri != null && !redirectUri.isBlank();
    }

    /**
     * Step 1 — Build the DigiLocker authorization URL.
     * Embeds a random CSRF state token tied to the userId.
     *
     * @param userId  The Student's user ID (from the users table)
     * @return  Full authorization URL to redirect the user's browser to
     */
    public String generateAuthUrl(Long userId) {
        if (!isConfigured()) {
            throw new IllegalStateException(
                "DigiLocker is not configured. Please set DIGILOCKER_CLIENT_ID, " +
                "DIGILOCKER_CLIENT_SECRET, and DIGILOCKER_REDIRECT_URI environment variables.");
        }

        // Generate a cryptographically random state token (CSRF protection)
        String state = UUID.randomUUID().toString().replace("-", "");
        stateStore.put(state, userId);

        String encodedRedirect = URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);

        return DIGILOCKER_AUTH_URL
            + "?response_type=code"
            + "&client_id=" + clientId
            + "&redirect_uri=" + encodedRedirect
            + "&state=" + state
            + "&scope=files.aadhar";
    }

    /**
     * Step 2 — Handle the OAuth callback from DigiLocker.
     *
     * Validates state, exchanges authorization code for access token,
     * fetches the Aadhaar document, uploads it to Cloudinary,
     * and marks the student as Aadhaar-verified in the DB.
     *
     * @param code   OAuth authorization code from DigiLocker
     * @param state  CSRF state token (must match what was sent in auth URL)
     * @return  Frontend redirect URL (e.g. /student/profile?digilocker=success)
     * @throws SecurityException  if state is invalid (CSRF attack)
     * @throws RuntimeException   if token exchange or document fetch fails
     */
    public String handleCallback(String code, String state) throws Exception {
        // ── 1. CSRF State Validation ─────────────────────────────────────────
        Long userId = stateStore.remove(state);
        if (userId == null) {
            throw new SecurityException(
                "Invalid or expired state parameter — possible CSRF attack or expired session.");
        }

        // ── 2. Exchange Authorization Code for Access Token ─────────────────
        HttpHeaders tokenHeaders = new HttpHeaders();
        tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        // DigiLocker requires Basic auth with client credentials for token endpoint
        tokenHeaders.setBasicAuth(clientId, clientSecret);

        MultiValueMap<String, String> tokenBody = new LinkedMultiValueMap<>();
        tokenBody.add("grant_type", "authorization_code");
        tokenBody.add("code", code);
        tokenBody.add("redirect_uri", redirectUri);

        HttpEntity<MultiValueMap<String, String>> tokenRequest =
            new HttpEntity<>(tokenBody, tokenHeaders);

        ResponseEntity<Map> tokenResponse;
        try {
            tokenResponse = restTemplate.postForEntity(DIGILOCKER_TOKEN_URL, tokenRequest, Map.class);
        } catch (Exception ex) {
            throw new RuntimeException("DigiLocker token exchange failed: " + ex.getMessage(), ex);
        }

        if (!tokenResponse.getStatusCode().is2xxSuccessful() || tokenResponse.getBody() == null) {
            throw new RuntimeException("DigiLocker token exchange returned non-200: "
                + tokenResponse.getStatusCode());
        }

        Map<String, Object> tokenData = tokenResponse.getBody();
        String accessToken  = (String) tokenData.get("access_token");
        String digilockerSub = (String) tokenData.get("sub"); // unique DigiLocker user ID

        if (accessToken == null || accessToken.isBlank()) {
            throw new RuntimeException("DigiLocker did not return an access_token in response.");
        }

        // ── 3. Fetch Aadhaar Document from DigiLocker ───────────────────────
        HttpHeaders docHeaders = new HttpHeaders();
        docHeaders.setBearerAuth(accessToken);
        HttpEntity<Void> docRequest = new HttpEntity<>(docHeaders);

        ResponseEntity<byte[]> docResponse;
        try {
            docResponse = restTemplate.exchange(
                DIGILOCKER_AADHAAR_URL, HttpMethod.GET, docRequest, byte[].class);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to fetch Aadhaar from DigiLocker: " + ex.getMessage(), ex);
        }

        if (!docResponse.getStatusCode().is2xxSuccessful()
                || docResponse.getBody() == null
                || docResponse.getBody().length == 0) {
            throw new RuntimeException(
                "Aadhaar document fetch returned empty or non-200: " + docResponse.getStatusCode());
        }

        byte[] aadhaarBytes = docResponse.getBody();

        // ── 4. Upload to Cloudinary ─────────────────────────────────────────
        Student student = studentRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Student not found for userId=" + userId));

        String folder = "students/" + (student.getStudentId() != null
            ? student.getStudentId() : "user_" + userId);
        String cloudinaryUrl = cloudinaryService.uploadBytes(aadhaarBytes, "aadhaar.pdf", folder);

        // ── 5. Mark Student as Aadhaar-Verified ────────────────────────────
        student.setAadharCardUrl(cloudinaryUrl);
        student.setIsAadharVerified(true);
        student.setAadharVerifiedAt(LocalDateTime.now());
        if (digilockerSub != null && !digilockerSub.isBlank()) {
            student.setDigilockerSub(digilockerSub);
        }
        studentRepository.save(student);

        System.out.println("DIGILOCKER: Student " + userId +
            " Aadhaar verified via DigiLocker. Document stored at: " + cloudinaryUrl);

        // ── 6. Return Frontend Redirect URL ────────────────────────────────
        return frontendBaseUrl + "/student/profile?digilocker=success";
    }

    /**
     * Returns the frontend base URL (used by controller for redirect).
     */
    public String getFrontendBaseUrl() {
        return frontendBaseUrl;
    }
}
