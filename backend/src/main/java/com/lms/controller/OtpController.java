package com.lms.controller;

import com.lms.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/otp")
public class OtpController {

    @Autowired
    private OtpService otpService;

    /** POST /api/auth/otp/send  body: { "phone": "9916877491" } */
    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        if (phone == null || phone.replaceAll("\\D", "").length() != 10) {
            return ResponseEntity.badRequest().body(Map.of("message", "Enter a valid 10-digit phone number"));
        }
        try {
            otpService.sendOtp(phone);
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully ✅"));
        } catch (Exception e) {
            System.err.println("OTP send failed: " + e.getMessage());
            return ResponseEntity.internalServerError()
                .body(Map.of("message", "Failed to send OTP. Please try again."));
        }
    }

    /** POST /api/auth/otp/verify  body: { "phone": "9916877491", "otp": "123456" } */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        String otp   = body.get("otp");
        if (phone == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phone and OTP are required"));
        }
        boolean valid = otpService.verifyOtp(phone, otp);
        if (valid) {
            return ResponseEntity.ok(Map.of("message", "Phone number verified ✅", "verified", true));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired OTP ❌", "verified", false));
        }
    }
}
