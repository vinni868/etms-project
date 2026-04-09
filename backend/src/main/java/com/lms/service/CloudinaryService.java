package com.lms.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.InputStreamContent;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.FileList;
import com.google.api.services.drive.model.Permission;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * CloudinaryService — handles ALL file uploads for the EtMS project.
 *
 * Priority: Google Drive → Cloudinary → Local Disk
 */
@Service
public class CloudinaryService {

    // ── Google Drive config ───────────────────────────────────────────────
    @Value("${google.drive.credentials-json:}")
    private String driveCredentialsJson;

    @Value("${google.drive.credentials-path:}")
    private String driveCredentialsPath;

    @Value("${google.drive.folder-id:}")
    private String driveFolderId;

    // ── Cloudinary credentials ────────────────────────────────────────────
    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    // ── Local storage config ──────────────────────────────────────────────
    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:8080}")
    private String appBaseUrl;

    // ─────────────────────────────────────────────────────────────────────
    private static final int GOOGLE_DRIVE = 1;
    private static final int CLOUDINARY   = 2;
    private static final int LOCAL_DISK   = 3;

    private int mode = LOCAL_DISK;
    private Drive driveService;
    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        if (isGoogleDriveConfigured()) {
            try {
                initGoogleDrive();
                mode = GOOGLE_DRIVE;
                System.out.println("FILE_STORAGE: ✅ Google Drive mode — folder: " + driveFolderId);
            } catch (Exception e) {
                System.err.println("FILE_STORAGE: ❌ Google Drive init failed: " + e.getMessage());
                initLocalDisk();
            }
        } else if (isCloudinaryConfigured()) {
            cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key",    apiKey,
                "api_secret", apiSecret,
                "secure",     true
            ));
            mode = CLOUDINARY;
            System.out.println("FILE_STORAGE: ✅ Cloudinary mode — cloud: " + cloudName);
        } else {
            initLocalDisk();
        }
    }

    private void initLocalDisk() {
        mode = LOCAL_DISK;
        System.out.println("FILE_STORAGE: 📁 Local disk mode — uploads dir: " + uploadDir);
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (Exception e) {
            System.err.println("FILE_STORAGE: Could not create upload directory: " + e.getMessage());
        }
    }

    private void initGoogleDrive() throws Exception {
        InputStream credStream;
        if (!driveCredentialsJson.isEmpty()) {
            credStream = new ByteArrayInputStream(driveCredentialsJson.getBytes());
        } else {
            credStream = new FileInputStream(driveCredentialsPath);
        }

        GoogleCredentials credentials = ServiceAccountCredentials
            .fromStream(credStream)
            .createScoped(Collections.singletonList(DriveScopes.DRIVE));

        driveService = new Drive.Builder(
            GoogleNetHttpTransport.newTrustedTransport(),
            JacksonFactory.getDefaultInstance(),
            new HttpCredentialsAdapter(credentials)
        ).setApplicationName("ETMS-LMS").build();
    }

    // ── Public API ────────────────────────────────────────────────────────

    public String upload(MultipartFile file, String folder, String resourceType) throws IOException {
        if (mode == GOOGLE_DRIVE) {
            return driveUpload(file.getInputStream(), file.getOriginalFilename(), file.getContentType(), folder);
        } else if (mode == CLOUDINARY) {
            return cloudinaryUpload(file.getBytes(), file.getOriginalFilename(), folder, resourceType);
        } else {
            return localUpload(file.getInputStream(), file.getOriginalFilename(), folder);
        }
    }

    public String uploadDocument(MultipartFile file, String folder) throws IOException {
        return upload(file, folder, "raw");
    }

    public String uploadImage(MultipartFile file, String folder) throws IOException {
        return upload(file, folder, "image");
    }

    public String uploadBytes(byte[] bytes, String fileName, String folder) throws IOException {
        if (mode == GOOGLE_DRIVE) {
            return driveUpload(new ByteArrayInputStream(bytes), fileName, guessMimeType(fileName), folder);
        } else if (mode == CLOUDINARY) {
            return cloudinaryUpload(bytes, fileName, folder, "raw");
        } else {
            return localUpload(new ByteArrayInputStream(bytes), fileName, folder);
        }
    }

    public void deleteByUrl(String fileUrl, String resourceType) {
        if (fileUrl == null || fileUrl.isBlank()) return;
        if (mode == GOOGLE_DRIVE) {
            driveDelete(fileUrl);
        } else if (mode == CLOUDINARY) {
            cloudinaryDelete(fileUrl, resourceType);
        } else {
            localDelete(fileUrl);
        }
    }

    public boolean isConfigured() {
        return true;
    }

    // ── Google Drive implementation ───────────────────────────────────────

    private boolean isGoogleDriveConfigured() {
        return (!driveCredentialsJson.isEmpty() || !driveCredentialsPath.isEmpty())
            && !driveFolderId.isEmpty();
    }

    private String driveUpload(InputStream inputStream, String fileName, String mimeType, String subFolder)
            throws IOException {
        try {
            String sanitized = sanitize(fileName);
            String uniqueName = UUID.randomUUID() + "_" + sanitized;

            String parentFolderId = getOrCreateSubfolder(subFolder);

            com.google.api.services.drive.model.File fileMetadata = new com.google.api.services.drive.model.File();
            fileMetadata.setName(uniqueName);
            fileMetadata.setParents(Collections.singletonList(parentFolderId));

            String contentType = (mimeType != null && !mimeType.isEmpty()) ? mimeType : "application/octet-stream";
            InputStreamContent mediaContent = new InputStreamContent(contentType, inputStream);

            com.google.api.services.drive.model.File uploaded = driveService.files()
                .create(fileMetadata, mediaContent)
                .setFields("id, name")
                .execute();

            Permission permission = new Permission();
            permission.setType("anyone");
            permission.setRole("reader");
            driveService.permissions().create(uploaded.getId(), permission).execute();

            String url = "https://drive.google.com/uc?export=view&id=" + uploaded.getId();
            System.out.println("GOOGLE_DRIVE: Uploaded '" + fileName + "' → " + url);
            return url;

        } catch (Exception e) {
            throw new IOException("Google Drive upload failed: " + e.getMessage(), e);
        }
    }

    private String getOrCreateSubfolder(String subFolderName) throws IOException {
        String query = "name='" + subFolderName + "' and '"
            + driveFolderId + "' in parents"
            + " and mimeType='application/vnd.google-apps.folder'"
            + " and trashed=false";

        FileList result = driveService.files().list()
            .setQ(query)
            .setFields("files(id, name)")
            .execute();

        List<com.google.api.services.drive.model.File> files = result.getFiles();
        if (files != null && !files.isEmpty()) {
            return files.get(0).getId();
        }

        com.google.api.services.drive.model.File folderMeta = new com.google.api.services.drive.model.File();
        folderMeta.setName(subFolderName);
        folderMeta.setMimeType("application/vnd.google-apps.folder");
        folderMeta.setParents(Collections.singletonList(driveFolderId));

        com.google.api.services.drive.model.File created = driveService.files()
            .create(folderMeta)
            .setFields("id")
            .execute();
        return created.getId();
    }

    private void driveDelete(String fileUrl) {
        try {
            if (fileUrl.contains("id=")) {
                String fileId = fileUrl.substring(fileUrl.indexOf("id=") + 3);
                if (fileId.contains("&")) {
                    fileId = fileId.substring(0, fileId.indexOf("&"));
                }
                driveService.files().delete(fileId).execute();
                System.out.println("GOOGLE_DRIVE: Deleted file " + fileId);
            }
        } catch (Exception e) {
            System.err.println("GOOGLE_DRIVE: Delete failed (non-fatal): " + e.getMessage());
        }
    }

    private String guessMimeType(String fileName) {
        if (fileName == null) return "application/octet-stream";
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".pdf"))  return "application/pdf";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png"))  return "image/png";
        if (lower.endsWith(".zip"))  return "application/zip";
        if (lower.endsWith(".mp4"))  return "video/mp4";
        if (lower.endsWith(".webm")) return "video/webm";
        return "application/octet-stream";
    }

    // ── Cloudinary implementation ─────────────────────────────────────────

    private boolean isCloudinaryConfigured() {
        return cloudName != null && !cloudName.isEmpty()
            && apiKey != null && !apiKey.isEmpty()
            && apiSecret != null && !apiSecret.isEmpty();
    }

    @SuppressWarnings("unchecked")
    private String cloudinaryUpload(byte[] bytes, String fileName, String folder, String resourceType)
            throws IOException {
        String sanitized = sanitize(fileName);
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

    // ── Local disk implementation ─────────────────────────────────────────

    private String localUpload(InputStream inputStream, String fileName, String folder) throws IOException {
        String sanitized = sanitize(fileName);
        String uniqueName = UUID.randomUUID() + "_" + sanitized;

        Path folderPath = Paths.get(uploadDir, folder);
        Files.createDirectories(folderPath);
        Path filePath = folderPath.resolve(uniqueName);

        Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);

        String url = appBaseUrl.replaceAll("/$", "") + "/uploads/" + folder + "/" + uniqueName;
        System.out.println("LOCAL_STORAGE: Saved '" + fileName + "' → " + url);
        return url;
    }

    private void localDelete(String fileUrl) {
        try {
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

    // ── Utility ──────────────────────────────────────────────────────────

    private String sanitize(String fileName) {
        if (fileName == null) return "file";
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
