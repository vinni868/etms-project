package com.lms.service.impl;

import com.lms.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        System.out.println("DEBUG: [START] Preparing to send OTP to: " + toEmail);
        System.out.println("DEBUG: [AUTH] Using Gmail account: " + fromEmail);
        System.out.println("DEBUG: [CONFIG] Using SSL Port 465 for SMTP connection");
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Secure OTP for Password Reset - LMS");

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

            helper.setText(htmlContent, true);
            mailSender.send(message);

            System.out.println("✅ HTML Email sent successfully to " + toEmail);

        } catch (Exception e) {
            System.err.println("❌ Critical Email Failure for " + toEmail + ": " + e.getMessage());
            e.printStackTrace(); // Print full stack trace for cloud deployment debugging
            throw new RuntimeException("Email delivery failed: " + e.getMessage());
        }
    }
}