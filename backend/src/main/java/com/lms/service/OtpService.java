package com.lms.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    @Value("${twilio.account.sid:}")
    private String accountSid;

    @Value("${twilio.auth.token:}")
    private String authToken;

    @Value("${twilio.phone.number:}")
    private String fromNumber;

    // OTP store: phone → {otp, expiry}
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    private static final int OTP_EXPIRY_SECONDS = 300; // 5 minutes
    private static final SecureRandom random = new SecureRandom();

    @PostConstruct
    public void init() {
        if (accountSid != null && !accountSid.isBlank() &&
            authToken  != null && !authToken.isBlank()) {
            Twilio.init(accountSid.trim(), authToken.trim());
            System.out.println("TWILIO: ✅ Initialized successfully");
        } else {
            System.err.println("TWILIO: ⚠️ Credentials not configured — OTP SMS disabled");
        }
    }

    /** Generate and send OTP to the given phone number (Indian: +91XXXXXXXXXX) */
    public void sendOtp(String phone) {
        String otp = String.format("%06d", random.nextInt(1_000_000));
        otpStore.put(normalise(phone), new OtpEntry(otp, Instant.now().plusSeconds(OTP_EXPIRY_SECONDS)));

        String to = toE164(phone);
        String body = "Your AppTechno Careers verification code is: " + otp +
                      "\nValid for 5 minutes. Do not share this with anyone.";

        Message.creator(new PhoneNumber(to), new PhoneNumber(fromNumber.trim()), body).create();
        System.out.println("TWILIO: OTP sent to " + to);
    }

    /** Verify OTP — returns true if correct and not expired */
    public boolean verifyOtp(String phone, String otp) {
        OtpEntry entry = otpStore.get(normalise(phone));
        if (entry == null) return false;
        if (Instant.now().isAfter(entry.expiry())) {
            otpStore.remove(normalise(phone));
            return false;
        }
        boolean match = entry.otp().equals(otp.trim());
        if (match) otpStore.remove(normalise(phone)); // one-time use
        return match;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String normalise(String phone) {
        return phone.replaceAll("\\D", "");
    }

    private String toE164(String phone) {
        String digits = normalise(phone);
        if (digits.startsWith("91") && digits.length() == 12) return "+" + digits;
        if (digits.length() == 10) return "+91" + digits;
        return "+" + digits;
    }

    private record OtpEntry(String otp, Instant expiry) {}
}
