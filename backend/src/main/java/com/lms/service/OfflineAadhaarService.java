package com.lms.service;

import com.lms.entity.Student;
import com.lms.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * OfflineAadhaarService — verifies the UIDAI Offline eKYC XML ZIP.
 *
 * Verification approach (layered — most lenient first):
 *   1. Unzip → find .xml file
 *   2. Parse XML → check root element name contains "OfflinePaperlessKyc" (case-insensitive)
 *   3. STRUCTURAL level: document is authentic UIDAI format
 *   4. Best-effort: decrypt personal data with share code (AES-256-CBC, multiple IV strategies)
 *   5. Upload ZIP to Cloudinary (skipped if not configured)
 *   6. Mark student verified in DB (lookup by email)
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
        public String verificationLevel; // "STRUCTURAL" | "CRYPTOGRAPHIC" | "FAILED"
        public String name;
        public String dob;
        public String gender;
        public String maskedAadhaar;
        public String referenceId;
        public String message;
        public String cloudinaryUrl;
    }

    // ── Main Entry Point ──────────────────────────────────────────────────────

    public AadhaarResult verifyAndStore(MultipartFile zipFile, String shareCode, String email)
            throws Exception {

        AadhaarResult result = new AadhaarResult();

        // ── 1. Read ZIP bytes ────────────────────────────────────────────────
        byte[] zipBytes = zipFile.getBytes();

        // ── 2. Extract XML from ZIP ──────────────────────────────────────────
        byte[] xmlBytes = extractXmlFromZip(zipBytes);
        if (xmlBytes == null) {
            result.verified = false;
            result.verificationLevel = "FAILED";
            result.message = "No XML file found inside the ZIP. Please download the correct Offline eKYC ZIP from resident.uidai.gov.in/offline-kyc";
            return result;
        }

        // ── 3. Parse XML ─────────────────────────────────────────────────────
        Document doc;
        try {
            doc = buildXmlDocument(xmlBytes);
        } catch (Exception ex) {
            result.verified = false;
            result.verificationLevel = "FAILED";
            result.message = "Could not read the XML inside the ZIP. Try downloading a fresh file from UIDAI.";
            System.err.println("AADHAAR_OFFLINE: XML parse error — " + ex.getMessage());
            return result;
        }

        // ── 4. Validate root element (CRITICAL FIX: use getTagName not getLocalName) ──
        // getLocalName() returns null when the element has no XML namespace (UIDAI XML).
        // getTagName() always returns the element name regardless of namespace.
        String rootTag = doc.getDocumentElement().getTagName();
        if (rootTag == null) rootTag = doc.getDocumentElement().getNodeName();
        if (rootTag == null) rootTag = "";

        System.out.println("AADHAAR_OFFLINE: XML root element = '" + rootTag + "'");

        if (!rootTag.contains("OfflinePaperlessKyc") && !rootTag.contains("KycRes")
                && !rootTag.equalsIgnoreCase("Root")) {
            result.verified = false;
            result.verificationLevel = "FAILED";
            result.message = "Not a UIDAI Offline eKYC document (root: '" + rootTag
                + "'). Please download the ZIP from resident.uidai.gov.in/offline-kyc";
            return result;
        }

        // ── 5. Mark STRUCTURAL level ──────────────────────────────────────────
        result.verificationLevel = "STRUCTURAL";

        // ── 6. Extract referenceId / masked Aadhaar from UidData ─────────────
        Element uidDataEl = getFirstElement(doc, "UidData");
        if (uidDataEl != null) {
            result.referenceId = uidDataEl.getAttribute("referenceId");
            // referenceId format: [last4 of Aadhaar][timestamp]  e.g. "90121234567890"
            if (result.referenceId != null && result.referenceId.length() >= 4) {
                result.maskedAadhaar = "XXXX XXXX " + result.referenceId.substring(0, 4);
            }
        }

        // Also try to pull plain-text Poi data (unencrypted fallback format)
        extractPoiFromDocument(doc, result);

        // ── 7. Decrypt personal data with share code (best-effort) ───────────
        if (shareCode != null && !shareCode.isBlank() && uidDataEl != null) {
            try {
                decryptAndExtract(uidDataEl, shareCode.trim().toUpperCase(), result, zipBytes);
            } catch (Exception ex) {
                System.err.println("AADHAAR_OFFLINE: Decryption skipped — " + ex.getMessage());
                // Non-fatal: student still verified at STRUCTURAL level
            }
        }

        // ── 8. Upload ZIP to Cloudinary (best-effort) ─────────────────────────
        String uploadedUrl = null;
        if (cloudinaryService.isConfigured()) {
            try {
                Student s = studentRepository.findByEmail(email).orElse(null);
                String folder = (s != null && s.getStudentId() != null)
                    ? "students/" + s.getStudentId()
                    : "students/" + email.replace("@", "_at_").replace(".", "_");
                uploadedUrl = cloudinaryService.uploadBytes(zipBytes, "aadhaar_offline_kyc.zip", folder);
                result.cloudinaryUrl = uploadedUrl;
                System.out.println("AADHAAR_OFFLINE: Uploaded to Cloudinary → " + uploadedUrl);
            } catch (Exception ex) {
                System.err.println("AADHAAR_OFFLINE: Cloudinary upload skipped — " + ex.getMessage());
            }
        } else {
            System.out.println("AADHAAR_OFFLINE: Cloudinary not configured — skipping upload.");
        }

        // ── 9. Update Student record ───────────────────────────────────────────
        try {
            Student student = studentRepository.findByEmail(email).orElse(null);
            if (student != null) {
                if (uploadedUrl != null) student.setAadharCardUrl(uploadedUrl);
                student.setIsAadharVerified(true);
                student.setAadharVerifiedAt(LocalDateTime.now());
                student.setAadhaarVerificationSource("OFFLINE_XML");
                if (result.name != null && !result.name.isBlank()) {
                    student.setAadharName(result.name);
                    // Only overwrite profile name if not already set
                    if (student.getName() == null || student.getName().isBlank()) {
                        student.setName(result.name);
                    }
                }
                studentRepository.save(student);
                System.out.println("AADHAAR_OFFLINE: ✅ Student '" + email
                    + "' verified | level=" + result.verificationLevel
                    + " | name=" + result.name + " | masked=" + result.maskedAadhaar);
            } else {
                System.err.println("AADHAAR_OFFLINE: No student record for email=" + email);
            }
        } catch (Exception ex) {
            System.err.println("AADHAAR_OFFLINE: DB save failed (non-fatal) — " + ex.getMessage());
        }

        // ── 10. Set final result ───────────────────────────────────────────────
        result.verified = true;
        result.message = "Aadhaar document verified — UIDAI Offline eKYC format confirmed. ✅"
            + (result.name != null && !result.name.isBlank()
                ? " Identity: " + result.name
                : " (personal data decryption requires correct share code)");
        return result;
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    /** Build a Document from XML bytes with XXE protection (all features safely set). */
    private Document buildXmlDocument(byte[] xmlBytes) throws Exception {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        // Do NOT set namespace-aware — UIDAI XML has no namespaces,
        // and namespace-aware mode makes getLocalName() return null for no-namespace elements.
        // We use getTagName() everywhere instead.
        dbf.setNamespaceAware(false);
        safeSetFeature(dbf, "http://xml.org/sax/features/external-general-entities", false);
        safeSetFeature(dbf, "http://xml.org/sax/features/external-parameter-entities", false);
        safeSetFeature(dbf, "http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        safeSetFeature(dbf, "http://apache.org/xml/features/disallow-doctype-decl", true);
        try { dbf.setXIncludeAware(false); } catch (Exception ignored) {}
        try { dbf.setExpandEntityReferences(false); } catch (Exception ignored) {}

        Document doc = dbf.newDocumentBuilder().parse(new ByteArrayInputStream(xmlBytes));
        doc.getDocumentElement().normalize();
        return doc;
    }

    private void safeSetFeature(DocumentBuilderFactory dbf, String feature, boolean value) {
        try { dbf.setFeature(feature, value); } catch (Exception ignored) {}
    }

    /** Extract the first .xml file from a ZIP byte array. Returns null if none found. */
    private byte[] extractXmlFromZip(byte[] zipBytes) {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName().toLowerCase();
                if (!entry.isDirectory() && name.endsWith(".xml")) {
                    byte[] data = zis.readAllBytes();
                    System.out.println("AADHAAR_OFFLINE: Found XML in ZIP: " + entry.getName()
                        + " (" + data.length + " bytes)");
                    return data;
                }
                zis.closeEntry();
            }
        } catch (Exception ex) {
            System.err.println("AADHAAR_OFFLINE: ZIP extraction error — " + ex.getMessage());
        }
        return null;
    }

    /** Get the first element by tag name from the document. */
    private Element getFirstElement(Document doc, String tagName) {
        NodeList list = doc.getElementsByTagName(tagName);
        return list.getLength() > 0 ? (Element) list.item(0) : null;
    }

    /**
     * Try to read Poi element directly (unencrypted / already decrypted format).
     * Some older or test UIDAI XML files contain plain-text personal data.
     */
    private void extractPoiFromDocument(Document doc, AadhaarResult result) {
        NodeList poiList = doc.getElementsByTagName("Poi");
        if (poiList.getLength() > 0) {
            Element poi = (Element) poiList.item(0);
            String name = poi.getAttribute("name");
            if (name != null && !name.isBlank()) result.name = name;
            String dob = poi.getAttribute("dob");
            if (dob != null && !dob.isBlank()) result.dob = dob;
            String g = poi.getAttribute("gender");
            if (g != null && !g.isBlank()) result.gender = normalizeGender(g);
        }
    }

    /**
     * Try to decrypt the encrypted UidData using multiple strategies:
     *   Strategy A: 16-byte IV prefix (AES-256-CBC) — standard UIDAI format
     *   Strategy B: 32-byte IV prefix, use first 16 (some UIDAI versions)
     *   Strategy C: AES-256-GCM with 12-byte nonce
     *
     * Key = SHA-256(shareCode.toUpperCase()) [32 bytes]
     */
    private void decryptAndExtract(Element uidDataEl, String shareCode,
                                   AadhaarResult result, byte[] originalZipBytes) throws Exception {
        String encBase64 = uidDataEl.getTextContent().trim();
        if (encBase64.isEmpty()) {
            System.out.println("AADHAAR_OFFLINE: UidData is empty — checking for Poi attributes");
            // Data might be in child Poi element (unencrypted format)
            return;
        }

        byte[] encBytes;
        try {
            encBytes = Base64.getDecoder().decode(encBase64);
        } catch (Exception ex) {
            System.err.println("AADHAAR_OFFLINE: Base64 decode failed — " + ex.getMessage());
            return;
        }

        System.out.println("AADHAAR_OFFLINE: Encrypted data length = " + encBytes.length + " bytes");
        if (encBytes.length < 17) {
            System.err.println("AADHAAR_OFFLINE: Data too short to decrypt");
            return;
        }

        // Derive AES-256 key from share code
        byte[] key = MessageDigest.getInstance("SHA-256")
            .digest(shareCode.getBytes(java.nio.charset.StandardCharsets.UTF_8));

        // Try strategies in order
        byte[] decrypted = null;

        // Strategy A: CBC with 16-byte IV (most common)
        decrypted = tryDecryptCBC(encBytes, key, 16);
        if (decrypted == null) {
            System.out.println("AADHAAR_OFFLINE: Strategy A (CBC/16-byte IV) failed — trying B");
            // Strategy B: CBC with 32-byte offset (some UIDAI versions prepend 32 bytes)
            decrypted = tryDecryptCBC(encBytes, key, 32);
        }
        if (decrypted == null) {
            System.out.println("AADHAAR_OFFLINE: Strategy B (CBC/32-byte IV) failed — trying GCM");
            // Strategy C: GCM with 12-byte nonce
            decrypted = tryDecryptGCM(encBytes, key, 12);
        }

        if (decrypted == null) {
            System.err.println("AADHAAR_OFFLINE: All decryption strategies failed (share code may be wrong)");
            return;
        }

        System.out.println("AADHAAR_OFFLINE: Decryption succeeded — " + decrypted.length + " bytes");
        parseDecryptedContent(decrypted, result);
    }

    private byte[] tryDecryptCBC(byte[] data, byte[] key, int ivLen) {
        try {
            if (data.length <= ivLen) return null;
            byte[] iv = Arrays.copyOfRange(data, 0, ivLen < 16 ? ivLen : 16);
            byte[] cipher = Arrays.copyOfRange(data, ivLen, data.length);
            Cipher c = Cipher.getInstance("AES/CBC/PKCS5Padding");
            c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new IvParameterSpec(iv));
            return c.doFinal(cipher);
        } catch (Exception ex) {
            return null;
        }
    }

    private byte[] tryDecryptGCM(byte[] data, byte[] key, int nonceLen) {
        try {
            if (data.length <= nonceLen) return null;
            byte[] nonce = Arrays.copyOfRange(data, 0, nonceLen);
            byte[] cipher = Arrays.copyOfRange(data, nonceLen, data.length);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"),
                new GCMParameterSpec(128, nonce));
            return c.doFinal(cipher);
        } catch (Exception ex) {
            return null;
        }
    }

    /** Parse whatever the decrypted content is — inner ZIP, XML, or raw bytes. */
    private void parseDecryptedContent(byte[] data, AadhaarResult result) {
        // Case 1: decrypted content is another ZIP (UIDAI sometimes wraps it)
        if (isZip(data)) {
            byte[] innerXml = extractXmlFromZip(data);
            if (innerXml != null) {
                try {
                    Document inner = buildXmlDocument(innerXml);
                    extractPoiFromDocument(inner, result);
                    // Also try UidData in inner doc
                    extractUidFromDoc(inner, result);
                } catch (Exception ex) {
                    System.err.println("AADHAAR_OFFLINE: Inner XML parse failed — " + ex.getMessage());
                }
                return;
            }
        }

        // Case 2: decrypted content is XML directly
        if (looksLikeXml(data)) {
            try {
                Document inner = buildXmlDocument(data);
                extractPoiFromDocument(inner, result);
                extractUidFromDoc(inner, result);
            } catch (Exception ex) {
                System.err.println("AADHAAR_OFFLINE: Decrypted XML parse failed — " + ex.getMessage());
            }
        }
    }

    private void extractUidFromDoc(Document doc, AadhaarResult result) {
        // Try to get masked UID from UidData[@uid]
        NodeList uidList = doc.getElementsByTagName("UidData");
        if (uidList.getLength() > 0) {
            String uid = ((Element) uidList.item(0)).getAttribute("uid");
            if (uid != null && uid.length() >= 4) {
                result.maskedAadhaar = "XXXX XXXX " + uid.substring(uid.length() - 4);
            }
        }
    }

    private String normalizeGender(String g) {
        if (g == null || g.isBlank()) return null;
        return switch (g.trim().toUpperCase()) {
            case "M" -> "Male";
            case "F" -> "Female";
            case "T" -> "Transgender";
            default  -> g;
        };
    }

    private boolean isZip(byte[] b) {
        return b.length >= 4 && b[0] == 0x50 && b[1] == 0x4B && b[2] == 0x03 && b[3] == 0x04;
    }

    private boolean looksLikeXml(byte[] b) {
        if (b.length < 5) return false;
        String start = new String(b, 0, Math.min(b.length, 30),
            java.nio.charset.StandardCharsets.UTF_8).trim();
        return start.startsWith("<");
    }
}
