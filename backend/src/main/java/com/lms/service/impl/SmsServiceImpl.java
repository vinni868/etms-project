package com.lms.service.impl;

import com.lms.service.SmsService;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsServiceImpl implements SmsService {

    @Value("${twilio.account.sid}")
    private String ACCOUNT_SID;

    @Value("${twilio.auth.token}")
    private String AUTH_TOKEN;

    @Value("${twilio.whatsapp.from}")
    private String FROM;

    @Override
    public void sendOtpSms(String phoneNumber, String otp) {
        try {
            Twilio.init(ACCOUNT_SID, AUTH_TOKEN);

            Message message = Message.creator(
                    new com.twilio.type.PhoneNumber("whatsapp:" + phoneNumber),
                    new com.twilio.type.PhoneNumber(FROM),
                    "Your LMS OTP is: " + otp + ". Valid for 15 minutes."
            ).create();

            System.out.println("SMS sent: " + message.getSid());

        } catch (Exception e) {
            System.err.println("SMS sending failed: " + e.getMessage());
        }
    }
}