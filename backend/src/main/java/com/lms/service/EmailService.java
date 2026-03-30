package com.lms.service;

public interface EmailService {
    void sendOtpEmail(String toEmail, String otp);
}