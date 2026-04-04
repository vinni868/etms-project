package com.lms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    @Value("${spring.mail.username:vinayakavinni868@gmail.com}")
    private String mailUsername;

    @Value("${spring.mail.password:wcmyeumypnenqlud}")
    private String mailPassword;

    @Bean
    public JavaMailSender javaMailSender() {
        System.out.println("LMS_INIT: Hard-Coding SMTP Configuration to [googlemail.com] Port 587 (RELAXED 60s)");
        
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.googlemail.com");
        mailSender.setPort(587); // STRICT PORT 587
        
        mailSender.setUsername(mailUsername);
        mailSender.setPassword(mailPassword);
        
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.debug", "false");
        
        // Render network tuning - Relaxed Timeout
        props.put("mail.smtp.connectiontimeout", "60000");
        props.put("mail.smtp.timeout", "60000");
        props.put("mail.smtp.writetimeout", "60000");
        
        // Force IPv4 if IPv6 is causing SocketTimeoutException
        System.setProperty("java.net.preferIPv4Stack", "true");
        
        return mailSender;
    }
}
