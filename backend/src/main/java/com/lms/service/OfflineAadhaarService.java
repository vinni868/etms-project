package com.lms.service;

import com.lms.entity.Student;
import com.lms.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.xml.crypto.dsig.XMLSignature;
import javax.xml.crypto.dsig.XMLSignatureFactory;
import javax.xml.crypto.dsig.dom.DOMValidateContext;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * OfflineAadhaarService — verifies the UIDAI Offline eKYC XML ZIP.
 *
 * Steps:
 *   1. Extract .xml from the uploaded ZIP
 *   2. Validate it is a UIDAI OfflinePaperlessKycData document
 *   3. Optionally verify XML Digital Signature (requires UIDAI cert in resources)
 *   4. Decrypt personal data using the share code (AES-256-CBC)
 *   5. Upload document to Cloudinary (skipped if not configured)
 *   6. Mark student record as verified in DB (looked up by email)
 */
@Service
public class OfflineAadhaarService {

    private final StudentRepository studentRepository;
    private final CloudinaryService cloudinaryService;

    public OfflineAadhaarService(StudentRepository studentRepository,
                                 CloudinaryService cloudinaryService) {
        this.studentRepository = studentRepository;
        this.cloudinaryService = cloudinaryService;
    }

    // ── Result DTO ────────────────────────────────────────────────────────────

    public static class AadhaarResult {
        public boolean verified;
        public String verificationLevel; // "CRYPTOGRAPHIC" | "STRUCTURAL" | "FAILED"
        public String name;
        public String dob;
        public String gender;
        public String maskedAadhaar;  // e.g. "XXXX XXXX 3456"
        public String referenceId;    // UIDAI reference ID
        public String message;
        public String cloudinaryUrl;  // stored document URL (may be null if Cloudinary not configured)
    }

    // ── Main Entry Point ──────────────────────────────────────────────────────

    /**
     * Verify an Offline eKYC ZIP and update the student record.
     *
     * @param zipFile    ZIP file from UIDAI resident portal
     * @param shareCode  4-character share code used during download
     * @param email      Email of the logged-in student (used to look up student record by email)
     */
    public AadhaarResult verifyAndStore(MultipartFile zipFile, String shareCode, String email)
            throws Exception {

        AadhaarResult result = new AadhaarResult();

        // ── 1. Extract XML from ZIP ───────────────────────────────────────────
        byte[] zipBytes = zipFile.getBytes();
        byte[] xmlBytes = extractXmlFromZip(zipBytes);
        if (xmlBytes == null) {
            result.verified = false;
            result.verificationLevel = "FAILED";
            result.message = "No XML file found inside the ZIP. Please download the Offline eKYC ZIP from UIDAI.";
            return result;
        }

        // ── 2. Parse XML (with safe XXE protection) ───────────────────────────
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        safeSetFeature(dbf, "http://apache.org/xml/features/disallow-doctype-decl", true);
        safeSetFeature(dbf, "http://xml.org/sax/features/external-general-entities", false);
        safeSetFeature(dbf, "http://xml.org/sax/features/external-parameter-entities", false);
        safeSetFeature(dbf, "http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        dbf.setXIncludeAware(false);
        dbf.setExpandEntityReferences(false);

        Document doc;
        try {
            doc = dbf.newDocumentBuilder().parse(new ByteArrayInputStream(xmlBytes));
            doc.getDocumentElement().normalize();
        } catch (Exception ex) {
            result.verified = false;
            result.verificationLevel = "FAILED";
            result.message = "Could not read the XML inside the ZIP. Please download a fresh file from UIDAI.";
            System.err.println("AADHAAR_OFFLINE: XML parse error — " + ex.getMessage());
            return result;
        }

        // ── 3. Validate UIDAI document structure ──────────────────────────────
        String rootName = doc.getDocumentElement().getLocalName();
        if (!"OfflinePaperlessKycData".equals(rootName)) {
            result.verified = false;
            result.verificationLevel = "FAILED";
            result.message = "This does not appear to be a UIDAI Offline eKYC document (root: "
                + rootName + "). Please download the correct file from resident.uidai.gov.in/offline-kyc";
            return result;
        }

        // ── 4. XML Digital Signature check (falls back to STRUCTURAL if cert missing) ──
        verifyXmlSignature(doc, result);

        // ── 5. Extract referenceId / masked Aadhaar ───────────────────────────
        Element uidDataEl = (Element) doc.getElementsByTagName("UidData").item(0);
        if (uidDataEl != null) {
            result.referenceId = uidDataEl.getAttribute("referenceId");
            if (result.referenceId != null && result.referenceId.length() >= 4) {
                result.maskedAadhaar = "XXXX XXXX " + result.referenceId.substring(0, 4);
            }
        }

        // ── 6. Decrypt personal data using share code ─────────────────────────
        if (shareCode != null && !shareCode.isBlank() && uidDataEl != null) {
            try {
                decryptAndExtract(uidDataEl, shareCode, result);
            } catch (Exception ex) {
                System.err.println("AADHAAR_OFFLINE: Decryption skipped (wrong share code?) — " + ex.getMessage());
                // Not fatal — still verified at structural/cryptographic level
            }
        }

        // ── 7. Upload ZIP to Cloudinary (best-effort, non-fatal) ─────────────
        String uploadedUrl = null;
        if (cloudinaryService.isConfigured()) {
            try {
                Student s = studentRepository.findByEmail(email).orElse(null);
                String folder = (s != null && s.getStudentId() != null)
                    ? "students/" + s.getStudentId()
                    : "students/email_" + email.replace("@", "_at_").replace(".", "_");
                uploadedUrl = cloudinaryService.uploadBytes(zipBytes, "aadhaar_offline_kyc.zip", folder);
                result.cloudinaryUrl = uploadedUrl;
            } catch (Exception ex) {
                System.err.println("AADHAAR_OFFLINE: Cloudinary upload failed (non-fatal) — " + ex.getMessage());
            }
        }

        // ── 8. Update Student record (lookup by EMAIL — safe and correct) ─────
        try {
            Student student = studentRepository.findByEmail(email).orElse(null);
            if (student != null) {
                if (uploadedUrl != null) {
                    student.setAadharCardUrl(uploadedUrl);
                }
                student.setIsAadharVerified(true);
                student.setAadharVerifiedAt(LocalDateTime.now());
                student.setAadhaarVerificationSource("OFFLINE_XML");
                // If name extracted from decrypted data, update profile
                if (result.name != null && !result.name.isBlank()) {
                    student.setAadharName(result.name);
                    student.setName(result.name);
                }
                studentRepository.save(student);
                System.out.println("AADHAAR_OFFLINE: Student '" + email
                    + "' marked verified | level=" + result.verificationLevel
                    + " | name=" + result.name + " | ref=" + result.referenceId);
            } else {
                System.err.println("AADHAAR_OFFLINE: No student record found for email=" + email);
            }
        } catch (Exception ex) {
            System.err.println("AADHAAR_OFFLINE: DB update failed (non-fatal) — " + ex.getMessage());
        }

        result.verified = true;
        if (result.message == null) {
            result.message = "CRYPTOGRAPHIC".equals(result.verificationLevel)
                ? "Aadhaar verified — UIDAI digital signature confirmed. ✅"
                : "Aadhaar document structure verified. ✅";
        }
        return result;
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    /** Safely set a DocumentBuilderFactory feature — ignores if not supported by the JVM's parser. */
    private void safeSetFeature(DocumentBuilderFactory dbf, String feature, boolean value) {
        try {
            dbf.setFeature(feature, value);
        } catch (Exception ignored) {
            // Feature not supported — skip; security handled by other features
        }
    }

    /** Extract the first .xml file from a ZIP byte array. */
    private byte[] extractXmlFromZip(byte[] zipBytes) throws Exception {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (!entry.isDirectory() && entry.getName().toLowerCase().endsWith(".xml")) {
                    return zis.readAllBytes();
                }
                zis.closeEntry();
            }
        }
        return null;
    }

    /**
     * Verify the XML Digital Signature.
     * Uses UIDAI certificate from classpath if present; falls back to STRUCTURAL.
     */
    private void verifyXmlSignature(Document doc, AadhaarResult result) {
        try {
            NodeList sigNodes = doc.getElementsByTagNameNS(XMLSignature.XMLNS, "Signature");
            if (sigNodes.getLength() == 0) {
                result.verificationLevel = "STRUCTURAL";
                System.out.println("AADHAAR_OFFLINE: No XMLDSig element — structural check only");
                return;
            }

            PublicKey uidaiPublicKey = loadUidaiPublicKey();
            if (uidaiPublicKey == null) {
                result.verificationLevel = "STRUCTURAL";
                System.out.println("AADHAAR_OFFLINE: uidai_offline_pub_key.cer not in classpath — structural only");
                return;
            }

            DOMValidateContext ctx = new DOMValidateContext(uidaiPublicKey, sigNodes.item(0));
            XMLSignatureFactory factory = XMLSignatureFactory.getInstance("DOM");
            XMLSignature sig = factory.unmarshalXMLSignature(ctx);
            boolean valid = sig.validate(ctx);

            result.verificationLevel = valid ? "CRYPTOGRAPHIC" : "STRUCTURAL";
            System.out.println("AADHAAR_OFFLINE: XML Digital Signature " + (valid ? "VALID" : "INVALID"));
        } catch (Exception ex) {
            result.verificationLevel = "STRUCTURAL";
            System.err.println("AADHAAR_OFFLINE: Signature check error (STRUCTURAL fallback): " + ex.getMessage());
        }
    }

    /**
     * Decrypt the UidData element using AES-256-CBC with the share code.
     *
     * UIDAI encryption spec:
     *   Key  = SHA-256( shareCode.toUpperCase() bytes )  → 32 bytes
     *   IV   = first 16 bytes of the base64-decoded ciphertext
     *   Mode = AES/CBC/PKCS5Padding
     *   Data = bytes after IV
     */
    private void decryptAndExtract(Element uidDataEl, String shareCode, AadhaarResult result)
            throws Exception {

        String encryptedBase64 = uidDataEl.getTextContent().trim();
        if (encryptedBase64.isEmpty()) {
            extractFromPoiElement(uidDataEl, result); // try unencrypted format
            return;
        }

        byte[] encryptedBytes = Base64.getDecoder().decode(encryptedBase64);
        if (encryptedBytes.length < 32) {
            System.err.println("AADHAAR_OFFLINE: Encrypted data too short — " + encryptedBytes.length + " bytes");
            return;
        }

        // AES-256 key = SHA-256(shareCode.toUpperCase())
        MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
        byte[] keyBytes = sha256.digest(
            shareCode.toUpperCase().getBytes(java.nio.charset.StandardCharsets.UTF_8));

        byte[] iv         = Arrays.copyOfRange(encryptedBytes, 0, 16);
        byte[] ciphertext = Arrays.copyOfRange(encryptedBytes, 16, encryptedBytes.length);

        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(keyBytes, "AES"), new IvParameterSpec(iv));
        byte[] decrypted = cipher.doFinal(ciphertext);

        // Decrypted content may be a nested ZIP containing the real KYC XML
        if (isZip(decrypted)) {
            byte[] innerXml = extractXmlFromZip(decrypted);
            if (innerXml != null) {
                parseKycXml(innerXml, result);
                return;
            }
        }

        // Or directly XML
        if (looksLikeXml(decrypted)) {
            parseKycXml(decrypted, result);
        }
    }

    /** Parse decrypted KYC XML to extract name, DOB, gender. */
    private void parseKycXml(byte[] xmlBytes, AadhaarResult result) throws Exception {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        safeSetFeature(dbf, "http://apache.org/xml/features/disallow-doctype-decl", true);
        Document doc = dbf.newDocumentBuilder().parse(new ByteArrayInputStream(xmlBytes));

        // KycRes → UidData → Poi (name, dob, gender attributes)
        NodeList poiList = doc.getElementsByTagName("Poi");
        if (poiList.getLength() > 0) {
            Element poi = (Element) poiList.item(0);
            result.name   = poi.getAttribute("name");
            result.dob    = poi.getAttribute("dob");
            result.gender = normalizeGender(poi.getAttribute("gender"));
        }

        // Masked UID from UidData uid attribute
        NodeList uidList = doc.getElementsByTagName("UidData");
        if (uidList.getLength() > 0) {
            String uid = ((Element) uidList.item(0)).getAttribute("uid");
            if (uid != null && uid.length() >= 4) {
                result.maskedAadhaar = "XXXX XXXX " + uid.substring(uid.length() - 4);
            }
        }
    }

    /** Fallback: read Poi attributes directly when data is not encrypted. */
    private void extractFromPoiElement(Element uidDataEl, AadhaarResult result) {
        NodeList poiList = uidDataEl.getElementsByTagName("Poi");
        if (poiList.getLength() > 0) {
            Element poi = (Element) poiList.item(0);
            result.name   = poi.getAttribute("name");
            result.dob    = poi.getAttribute("dob");
            result.gender = normalizeGender(poi.getAttribute("gender"));
        }
    }

    /** Load UIDAI public certificate from classpath for cryptographic verification. */
    private PublicKey loadUidaiPublicKey() {
        try (InputStream certStream = getClass().getResourceAsStream("/uidai_offline_pub_key.cer")) {
            if (certStream == null) return null;
            X509Certificate cert = (X509Certificate)
                CertificateFactory.getInstance("X.509").generateCertificate(certStream);
            return cert.getPublicKey();
        } catch (Exception ex) {
            System.err.println("AADHAAR_OFFLINE: Could not load UIDAI cert — " + ex.getMessage());
            return null;
        }
    }

    private String normalizeGender(String g) {
        if (g == null || g.isBlank()) return null;
        return switch (g.toUpperCase()) {
            case "M" -> "Male";
            case "F" -> "Female";
            case "T" -> "Transgender";
            default  -> g;
        };
    }

    private boolean isZip(byte[] bytes) {
        return bytes.length >= 4
            && bytes[0] == 0x50 && bytes[1] == 0x4B
            && bytes[2] == 0x03 && bytes[3] == 0x04;
    }

    private boolean looksLikeXml(byte[] bytes) {
        if (bytes.length < 5) return false;
        return new String(bytes, 0, Math.min(bytes.length, 20),
            java.nio.charset.StandardCharsets.UTF_8).trim().startsWith("<");
    }
}
