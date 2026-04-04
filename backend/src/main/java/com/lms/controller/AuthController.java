package com.lms.controller;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.lms.dto.LoginRequest;
import com.lms.dto.LoginResponse;
import com.lms.dto.RegisterRequest;
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import com.lms.service.UserService;
import com.lms.security.JwtService;
import com.lms.security.CustomUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import com.lms.repository.CourseRepository;
import com.lms.entity.CourseMaster;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private CourseRepository courseRepository;

    AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Simple in-memory OTP cache for signup (since user doesn't exist yet)
    private static final java.util.concurrent.ConcurrentHashMap<String, SignupOtpData> signupOtpCache = new java.util.concurrent.ConcurrentHashMap<>();

    private static class SignupOtpData {
        String otp;
        java.time.LocalDateTime expiry;
        SignupOtpData(String o, java.time.LocalDateTime e) { otp = o; expiry = e; }
    }

    // =========================
    // REGISTER
    // =========================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        User user = userService.register(request);

        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Registration failed"));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Registration successful",
                "userId", String.valueOf(user.getId())
        ));
    }

    // =========================
    // LOGIN (SESSION CREATION)
    // =========================
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpSession session) {

        try {

            User user = userService.login(
                    request.getEmail(),
                    request.getPassword()
            );

            // Generate JWT Token
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            String jwt = jwtService.generateToken(userDetails);

            LoginResponse response = new LoginResponse(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole().getRoleName(),
                    jwt,
                    user.getStudentId(),
                    user.getPortalId()
            );

            return ResponseEntity.ok(response);

        } catch (RuntimeException ex) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    // =========================
    // LOGOUT
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/courses")
    public ResponseEntity<List<CourseMaster>> getPublicCourses() {
        return ResponseEntity.ok(courseRepository.findAll());
    }

    @Autowired
    private com.lms.service.EmailService emailService;

    @Autowired
    private com.lms.service.SmsService smsService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {

        String email = payload.get("email");

        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        User user = optionalUser.get();

        // Generate OTP
        String otp = String.valueOf((int)((Math.random() * 900000) + 100000));

        user.setResetOtp(otp);
        user.setResetOtpExpiry(java.time.LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        // ✅ Send Email
        try {
            emailService.sendOtpEmail(user.getEmail(), otp);
        } catch (Exception e) {
            System.err.println("SMTP ERROR for " + email + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to send reset email. Please try again later or contact support."));
        }

        // ✅ Send SMS (if phone exists)
        if (user.getPhone() != null) {
            smsService.sendOtpSms(user.getPhone(), otp);
        }

        System.out.println("DEBUG OTP for " + email + ": " + otp);

        return ResponseEntity.ok(Map.of("message", "OTP sent to email and mobile."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");

        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));

        User user = optionalUser.get();
        if (user.getResetOtp() == null || !user.getResetOtp().equals(otp)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid OTP"));
        }

        if (user.getResetOtpExpiry().isBefore(java.time.LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "OTP Expired"));
        }

        return ResponseEntity.ok(Map.of("message", "OTP Verified. Proceed to reset."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        String newPassword = payload.get("newPassword");

        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));

        User user = optionalUser.get();
        
        // Final verification
        if (user.getResetOtp() == null || !user.getResetOtp().equals(otp)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Unauthorized reset attempt"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetOtp(null); // Clear OTP after use
        user.setResetOtpExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successful. You can now login."));
    }

    @PostMapping("/send-signup-otp")
    public ResponseEntity<?> sendSignupOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }
        
        if (!email.toLowerCase().endsWith("@gmail.com")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only Gmail addresses are allowed. Please use a valid @gmail.com address."));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is already registered. Please login."));
        }

        String otp = String.valueOf((int)((Math.random() * 900000) + 100000));
        signupOtpCache.put(email, new SignupOtpData(otp, java.time.LocalDateTime.now().plusMinutes(10)));

        try {
            emailService.sendOtpEmail(email, otp);
        } catch (Exception e) {
            System.err.println("SMTP ERROR during signup for " + email + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Email delivery failed. Please check your Gmail address or try again later."));
        }

        System.out.println("DEBUG SIGNUP OTP for " + email + ": " + otp);

        return ResponseEntity.ok(Map.of("message", "OTP sent successfully to " + email));
    }

    @PostMapping("/verify-signup-otp")
    public ResponseEntity<?> verifySignupOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");

        SignupOtpData data = signupOtpCache.get(email);
        if (data == null || !data.otp.equals(otp)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid OTP. Please try again."));
        }
        
        if (data.expiry.isBefore(java.time.LocalDateTime.now())) {
            signupOtpCache.remove(email);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "OTP has expired. Please request a new one."));
        }

        // Remove OTP after successful verification to prevent reuse
        signupOtpCache.remove(email);

        return ResponseEntity.ok(Map.of("message", "Email verified successfully."));
    }
}

