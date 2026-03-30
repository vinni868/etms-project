package com.lms.service;

public interface SmsService {
    void sendOtpSms(String phoneNumber, String otp);
}