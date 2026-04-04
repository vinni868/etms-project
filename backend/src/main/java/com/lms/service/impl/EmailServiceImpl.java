package com.lms.service.impl;

import com.lms.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@Service
public class EmailServiceImpl implements EmailService {

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${spring.mail.username:vinayakavinni868@gmail.com}")
    private String fromEmail;

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        System.out.println("DEBUG: [START] Sending Firewall-Proof Email via BREVO API");
        System.out.println("DEBUG: [API] Using HTTPS Port 443 (Firewall Bypass)");
        
        try {
            URL url = new URL("https://api.brevo.com/v3/smtp/email");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("api-key", brevoApiKey);
            conn.setDoOutput(true);

            String htmlContent = 
                "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>" +
                "  <h2 style='color: #2c3e50; text-align: center;'>LMS Password Reset</h2>" +
                "  <p style='color: #34495e; font-size: 16px;'>Dear User,</p>" +
                "  <p style='color: #34495e; font-size: 16px;'>You requested to reset your password. Please use the following 6-digit OTP to proceed:</p>" +
                "  <div style='background-color: #f7f9fb; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;'>" +
                "    <span style='font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3498db;'>" + otp + "</span>" +
                "  </div>" +
                "  <p style='color: #e74c3c; font-size: 14px;'><b>Note:</b> This OTP will expire in 15 minutes. For security reasons, do not share this code with anyone.</p>" +
                "  <hr style='border: 0; border-top: 1px solid #eee; margin: 25px 0;'>" +
                "  <p style='color: #7f8c8d; font-size: 12px; text-align: center;'>Best Regards,<br>LMS Technical Team</p>" +
                "</div>";

            // Properly escaped JSON payload
            String jsonInputString = String.format(
                "{\"sender\":{\"name\":\"EtMS Support\",\"email\":\"%s\"},\"to\":[{\"email\":\"%s\"}],\"subject\":\"Secure OTP for Password Reset - LMS\",\"htmlContent\":\"%s\"}",
                fromEmail, toEmail, htmlContent.replace("\"", "\\\"")
            );

            try(OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonInputString.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);           
            }

            int responseCode = conn.getResponseCode();
            if (responseCode >= 200 && responseCode <= 299) {
                System.out.println("✅ BREVO API SUCCESS: Email delivered to " + toEmail);
            } else {
                throw new RuntimeException("Brevo API failed with response code: " + responseCode);
            }

        } catch (Exception e) {
            System.err.println("❌ CRITICAL BREVO FAILURE: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Firewall-Proof email delivery failed: " + e.getMessage());
        }
    }
}