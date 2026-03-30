package com.lms.controller;

import com.lms.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @GetMapping("/test")
    public String test() {
        return "Chat Controller is reachable!";
    }

    @PostMapping("/message")
    public Map<String, String> getMessage(@RequestBody Map<String, String> payload, 
                                          org.springframework.security.core.Authentication authentication) {
        String message = payload.get("message");
        String sessionId = payload.get("sessionId");
        
        System.out.println("DEBUG: Incoming Chat Request -> Session: " + sessionId + ", Msg: " + message);
        
        String response = chatService.getResponse(sessionId, message, authentication);
        
        System.out.println("DEBUG: AI Response Generated -> " + response.substring(0, Math.min(20, response.length())) + "...");
        
        return Map.of("response", response);
    }
}
