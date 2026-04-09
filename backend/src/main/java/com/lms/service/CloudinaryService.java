package com.lms.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

/**
 * CloudinaryService — handles ALL file uploads for the EtMS project.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  MODE 1 — CLOUDINARY  (when CLOUDINARY_* env vars are set)         │
 * │  Files are uploaded to Cloudinary CDN.                              │
 * │  Use on Render, Vercel, or any cloud platform.                      │
 * │                                                                     │
 * │  MODE 2 — LOCAL DISK  (when CLOUDINARY_* env vars are NOT set)     │
 * │  Files are saved to local filesystem under `file.upload.dir`.       │
 * │  Use on a self-hosted VPS with Nginx serving /uploads/*.            │
 * │  URLs are built as: {app.base-url}/uploads/{folder}/{filename}      │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * VPS Nginx config needed for local mode:
 *   location /uploads/ {
 *       alias /home/etms/uploads/;
 *       expires 30d;
 *       add_header Cache-Control "public";
 *   }
 *
 * application.properties additions for VPS:
 *   file.upload.dir=/home/etms/uploads
 *   app.base-url=https://yourdomain.com
 */
@Service
public class CloudinaryService {

    // ── Cloudinary credentials (set in Render / env vars) ────────────────
    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    // ── Local storage config (set in application.properties for VPS) ─────
    @Value("${file.upload.dir:uploads}")
    private String uploadDir;          // absolute path e.g. /home/etms/uploads

    @Value("${app.base-url:http://localhost:8080}")
    private String appBaseUrl;         // e.g. https://yourdomain.com

    // ─────────────────────────────────────────────────────────────────────
    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        if (isCloudinaryConfigured()) {
            cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key",    apiKey,
                "api_secret", apiSecret,
                "secure",     true
            ));
            System.out.println("FILE_STORAGE: ✅ Cloudinary mode — cloud: " + cloudName);
        } else {
            System.out.println("FILE_STORAGE: 📁 Local disk mode — uploads dir: " + uploadDir);
            // Ensure upload directory exists
            try {
                Files.createDirectories(Paths.get(uploadDir));
            } catch (Exception e) {
                System.err.println("FILE_STORAGE: Could not create upload directory: " + e.getMessage());
            }
        }
    }

    // ── Public API (same interface as before — all callers unchanged) ─────

    /**
     * Upload a MultipartFile — PDF, image, or any file.
     *
     * @param file         The upload from the HTTP request
     * @param folder       Sub-folder name (e.g. "syllabus", "leaves", "students")
     * @param resourceType "raw" | "image" | "auto" (only used in Cloudinary mode)
     * @return Permanent HTTPS URL to the file
     */
    public String upload(MultipartFile file, String folder, String resourceType) throws IOException {
        if (isCloudinaryConfigured()) {
            return cloudinaryUpload(file.getBytes(), file.getOriginalFilename(), folder, resourceType);
        } else {
            return localUpload(file.getInputStream(), file.getOriginalFilename(), folder);
        }
    }

    /** Upload a PDF / document (resource_type = "raw" for Cloudinary). */
    public String uploadDocument(MultipartFile file, String folder) throws IOException {
        return upload(file, folder, "raw");
    }

    /** Upload an image. */
    public String uploadImage(MultipartFile file, String folder) throws IOException {
        return upload(file, folder, "image");
    }

    /** Upload raw bytes (used by DigiLocker and Offline Aadhaar services). */
    public String uploadBytes(byte[] bytes, String fileName, String folder) throws IOException {
        if (isCloudinaryConfigured()) {
            return cloudinaryUpload(bytes, fileName, folder, "raw");
        } else {
            return localUpload(new java.io.ByteArrayInputStream(bytes), fileName, folder);
        }
    }

    /**
     * Delete a file by its URL.
     * In Cloudinary mode: destroys the asset.
     * In local mode: deletes the file from disk.
     */
    public void deleteByUrl(String fileUrl, String resourceType) {
        if (fileUrl == null || fileUrl.isBlank()) return;
        if (isCloudinaryConfigured()) {
            cloudinaryDelete(fileUrl, resourceType);
        } else {
            localDelete(fileUrl);
        }
    }

    /**
     * isConfigured() — always returns true.
     * In Cloudinary mode: Cloudinary is used.
     * In local mode: local disk is used.
     *
     * Callers that checked isConfigured() before uploading will now always proceed.
     */
    public boolean isConfigured() {
        return true;
    }

    // ── Private — Cloudinary implementation ──────────────────────────────

    private boolean isCloudinaryConfigured() {
        return cloudName != null && !cloudName.isEmpty()
            && apiKey != null && !apiKey.isEmpty()
            && apiSecret != null && !apiSecret.isEmpty();
    }

    @SuppressWarnings("unchecked")
    private String cloudinaryUpload(byte[] bytes, String fileName, String folder, String resourceType)
            throws IOException {
        String sanitized = sanitize(fileName);
        // Strip extension from publicId for image/auto mode
        String nameForId = sanitized;
        int lastDot = nameForId.lastIndexOf('.');
        if (lastDot > 0 && !"raw".equals(resourceType)) {
            nameForId = nameForId.substring(0, lastDot);
        }
        String publicId = folder + "/" + UUID.randomUUID() + "_" + nameForId;

        Map<String, Object> result = cloudinary.uploader().upload(
            bytes,
            ObjectUtils.asMap(
                "public_id",     publicId,
                "resource_type", resourceType,
                "overwrite",     false
            )
        );
        String url = (String) result.get("secure_url");
        System.out.println("CLOUDINARY: Uploaded '" + fileName + "' → " + url);
        return url;
    }

    private void cloudinaryDelete(String cloudinaryUrl, String resourceType) {
        try {
            String[] parts = cloudinaryUrl.split("/upload/");
            if (parts.length < 2) return;
            String publicId = parts[1].replaceFirst("v\\d+/", "");
            int dotIdx = publicId.lastIndexOf('.');
            if ("image".equals(resourceType) && dotIdx > 0) {
                publicId = publicId.substring(0, dotIdx);
            }
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", resourceType));
            System.out.println("CLOUDINARY: Deleted " + publicId);
        } catch (Exception e) {
            System.err.println("CLOUDINARY: Delete failed (non-fatal): " + e.getMessage());
        }
    }

    // ── Private — Local disk implementation ──────────────────────────────

    private String localUpload(InputStream inputStream, String fileName, String folder)
            throws IOException {
        String sanitized = sanitize(fileName);
        String uniqueName = UUID.randomUUID() + "_" + sanitized;

        // Build path: uploadDir/folder/uniqueName
        Path folderPath = Paths.get(uploadDir, folder);
        Files.createDirectories(folderPath);
        Path filePath = folderPath.resolve(uniqueName);

        Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);

        // Build public URL: https://yourdomain.com/uploads/folder/uniqueName
        String url = appBaseUrl.replaceAll("/$", "")
            + "/uploads/" + folder + "/" + uniqueName;
        System.out.println("LOCAL_STORAGE: Saved '" + fileName + "' → " + url);
        return url;
    }

    private void localDelete(String fileUrl) {
        try {
            // Extract relative path from URL: /uploads/folder/filename
            String marker = "/uploads/";
            int idx = fileUrl.indexOf(marker);
            if (idx < 0) return;
            String relative = fileUrl.substring(idx + marker.length());
            Path filePath = Paths.get(uploadDir, relative.replace("/", java.io.File.separator));
            Files.deleteIfExists(filePath);
            System.out.println("LOCAL_STORAGE: Deleted " + filePath);
        } catch (Exception e) {
            System.err.println("LOCAL_STORAGE: Delete failed (non-fatal): " + e.getMessage());
        }
    }

    // ── Shared utility ────────────────────────────────────────────────────

    private String sanitize(String fileName) {
        if (fileName == null) return "file";
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
