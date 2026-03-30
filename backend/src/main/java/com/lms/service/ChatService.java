package com.lms.service;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import com.lms.repository.AttendanceRepository;
import com.lms.entity.TrainerMarkedAttendance;
import com.lms.security.CustomUserDetails;
import java.util.List;

@Service
public class ChatService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    private final Optional<ChatClient> chatClient;
    private Map<String, String> userSessions = new HashMap<>();

    public ChatService(@Autowired(required = false) ChatClient.Builder chatClientBuilder) {
        if (chatClientBuilder != null) {
            this.chatClient = Optional.of(chatClientBuilder.build());
        } else {
            this.chatClient = Optional.empty();
        }
    }

    public String getResponse(String sessionId, String message, org.springframework.security.core.Authentication authentication) {
        String input = message.toLowerCase();
        
        // Context Tracking
        String specificContext = "";
        String userIdentity = "friend";

        if (authentication != null && authentication.isAuthenticated() && 
            !(authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)) {
            try {
                Object principal = authentication.getPrincipal();
                if (principal instanceof CustomUserDetails) {
                    CustomUserDetails details = (CustomUserDetails) principal;
                    com.lms.entity.User dbUser = details.getUser();
                    userIdentity = dbUser.getName();
                    
                    specificContext = String.format(" The user is LOGGED IN. Name: %s, Role: %s, Email: %s.", 
                                                    userIdentity, dbUser.getRole().getRoleName(), dbUser.getEmail());

                    if (dbUser.getRole().getRoleName().equalsIgnoreCase("STUDENT")) {
                        // Dynamically pull their attendance stats
                        List<TrainerMarkedAttendance> attList = attendanceRepository.findByStudentId(dbUser.getId().intValue());
                        long totalDays = attList.size();
                        long presentDays = attList.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus())).count();
                        long absentDays = attList.stream().filter(a -> "ABSENT".equalsIgnoreCase(a.getStatus())).count();
                        
                        specificContext += String.format(" Attendance Record: Total Days %d, Present %d, Absent %d. Use this verbatim if they ask about their attendance.", totalDays, presentDays, absentDays);
                    }
                }
            } catch (Exception e) {
                System.err.println("DEBUG: Failed to extract user context for ChatService -> " + e.getMessage());
            }
        } else if (input.contains("i am") || input.contains("my name is")) {
            userIdentity = extractName(message);
            userSessions.put(sessionId, userIdentity);
        } else if (userSessions.containsKey(sessionId)) {
            userIdentity = userSessions.get(sessionId);
        }

        // AI Dynamic Response
        if (chatClient.isPresent()) {
            try {
                String aiPrompt = String.format(
                    "You are the 'AppTechno Careers' AI Support assistant. " +
                    "Identity: You represent AppTechno Careers (an IT/Non-IT training & placement institute). " +
                    "Knowledge: We offer Java Full Stack, Python AI, MERN, and Software Testing. We have 500+ partners and a 'Pay 50%% After Placement' model. " +
                    "Tone: Professional, helpful, concise, and friendly. " +
                    "Context Information: %s " +
                    "User Message: %s. " +
                    "Respond to the user naturally based on context.",
                    specificContext.isEmpty() ? "The user is an anonymous guest." : specificContext, message
                );
                
                String response = chatClient.get().prompt(aiPrompt).call().content();
                return (response != null && !response.isEmpty()) ? response : "I'm processing that. How else can I assist with your career goals?";
            } catch (Exception e) {
                System.err.println("DEBUG: AI Chat Error: " + e.getMessage());
            }
        }

        // Reliable Fallback if AI or Client fails
        return "Thanks for reaching out! AppTechno Careers offers top-tier training in Java, Python, and MERN with placement support. Please call +91 7022928198.";
    }

    private String extractName(String message) {
        String[] words = message.split("\\s+");
        // Simple logic: take the last word if it's not "am" or "is"
        for (int i = words.length - 1; i >= 0; i--) {
            String w = words[i].toLowerCase();
            if (!w.equals("am") && !w.equals("is") && !w.equals("i") && !w.equals("my") && !w.equals("name")) {
                return words[i];
            }
        }
        return "friend";
    }
}
