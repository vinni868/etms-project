package com.lms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LmsApplication {

	public static void main(String[] args) {
		// Set default timezone to IST before Spring starts
		java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
		
		io.github.cdimascio.dotenv.Dotenv dotenv = io.github.cdimascio.dotenv.Dotenv.configure().ignoreIfMissing().load();
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
		
		SpringApplication.run(LmsApplication.class, args);
		
		// Final Build Diagnostic Log
		System.out.println("LMS_INIT: Standardized Timezone [Asia/Kolkata]");
		System.out.println("LMS_INIT: Build Status [PROPER]");
	}

}
