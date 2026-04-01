package com.lms.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * CloudinaryService — handles ALL file uploads for the EtMS project.
 *
 * Replaces ephemeral local-disk storage so files survive Render redeploys.
 *
 * Free tier: 25 GB bandwidth / month, 1 GB storage.
 * Supports: PDF, images (JPG/PNG), any raw file.
 *
 * Environment variables required (set in Render dashboard):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */
@Service
public class CloudinaryService {

    @Value("${CLOUDINARY_CLOUD_NAME:}")
    private String cloudName;

    @Value("${CLOUDINARY_API_KEY:}")
    private String apiKey;

    @Value("${CLOUDINARY_API_SECRET:}")
    private String apiSecret;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        cloudinary = new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key",    apiKey,
            "api_secret", apiSecret,
            "secure",     true
        ));
        System.out.println("CLOUDINARY: Initialized — cloud=" + cloudName
            + " | configured=" + (!cloudName.isEmpty() && !apiKey.isEmpty()));
    }

    /**
     * Upload a file to Cloudinary.
     *
     * @param file       The multipart file from the HTTP request
     * @param folder     Cloudinary folder name (e.g. "syllabus", "leaves", "certificates")
     * @param resourceType  "raw" for PDFs/docs, "image" for images, "auto" for detection
     * @return The permanent HTTPS URL to the uploaded file
     */
    public String upload(MultipartFile file, String folder, String resourceType) throws IOException {
        if (!isConfigured()) {
            throw new RuntimeException("Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.");
        }

        // Use a unique public_id (random UUID suffix) to avoid name collisions
        String publicId = UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());

        @SuppressWarnings("unchecked")
        Map<String, Object> result = cloudinary.uploader().upload(
            file.getBytes(),
            ObjectUtils.asMap(
                "public_id",     publicId,
                "resource_type", resourceType,
                "folder",        folder,
                "overwrite",     false
            )
        );

        String url = (String) result.get("secure_url");
        System.out.println("CLOUDINARY: Uploaded '" + file.getOriginalFilename() + "' → " + url);
        return url;
    }

    /**
     * Convenience: upload a PDF or document (resource_type = "raw").
     */
    public String uploadDocument(MultipartFile file, String folder) throws IOException {
        return upload(file, folder, "raw");
    }

    /**
     * Convenience: upload an image (resource_type = "image").
     */
    public String uploadImage(MultipartFile file, String folder) throws IOException {
        return upload(file, folder, "image");
    }

    /**
     * Delete a file from Cloudinary using its public_id extracted from the URL.
     * Safe to call — won't throw if the file doesn't exist.
     */
    public void deleteByUrl(String cloudinaryUrl, String resourceType) {
        if (!isConfigured() || cloudinaryUrl == null || cloudinaryUrl.isBlank()) return;
        try {
            // Extract public_id from URL
            // URL pattern: https://res.cloudinary.com/{cloud}/raw/upload/v{version}/{public_id}
            String[] parts = cloudinaryUrl.split("/upload/");
            if (parts.length < 2) return;
            String withVersion = parts[1]; // e.g. "v1234567/syllabus/abc.pdf"
            String publicId = withVersion.replaceFirst("v\\d+/", ""); // remove version prefix
            // Remove file extension for raw resources if present
            int dotIdx = publicId.lastIndexOf('.');
            if ("image".equals(resourceType) && dotIdx > 0) {
                publicId = publicId.substring(0, dotIdx);
            }

            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", resourceType));
            System.out.println("CLOUDINARY: Deleted public_id=" + publicId);
        } catch (Exception e) {
            System.err.println("CLOUDINARY: Delete failed (non-fatal): " + e.getMessage());
        }
    }

    public boolean isConfigured() {
        return cloudName != null && !cloudName.isEmpty()
            && apiKey != null && !apiKey.isEmpty()
            && apiSecret != null && !apiSecret.isEmpty();
    }

    private String sanitize(String fileName) {
        if (fileName == null) return "file";
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
