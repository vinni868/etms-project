package com.lms.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.lms.repository.AttendanceRepository;
import com.lms.repository.LeaveRequestRepository;
import com.lms.repository.UserRepository;
import com.lms.entity.TrainerMarkedAttendance;
import com.lms.entity.LeaveRequest;
import com.lms.security.CustomUserDetails;
import com.lms.entity.User;

@Service
public class ChatService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

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
        
        // 1. Resolve Identity and Role
        String role = "PUBLIC";
        String userName = "friend";
        Long userId = null;

        if (authentication != null && authentication.isAuthenticated() && 
            !(authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)) {
            try {
                Object principal = authentication.getPrincipal();
                if (principal instanceof CustomUserDetails) {
                    CustomUserDetails details = (CustomUserDetails) principal;
                    User dbUser = details.getUser();
                    userName = dbUser.getName();
                    userId = dbUser.getId();
                    role = dbUser.getRole().getRoleName().toUpperCase();
                }
            } catch (Exception e) {
                System.err.println("DEBUG: Failed to extract user context for ChatService -> " + e.getMessage());
            }
        } else {
            // Unauthenticated Guest session tracking
            if (input.contains("i am") || input.contains("my name is")) {
                userName = extractName(message);
                userSessions.put(sessionId, userName);
            } else if (userSessions.containsKey(sessionId)) {
                userName = userSessions.get(sessionId);
            }
        }

        // 2. Intent Detection for Human Handoff (All Users)
        if (input.matches(".*\\b(human|real person|talk to someone|call|whatsapp|contact\\s*number|schedule\\s*call)\\b.*")) {
            try {
                String notifMsg = String.format("Website User [%s] requested to connect with a human representative via the AI Chat.", userName);
                notificationService.createNotification(notifMsg, "INFO", "SUPERADMIN");
                notificationService.createNotification(notifMsg, "INFO", "ADMIN");
            } catch (Exception e) {
                System.err.println("DEBUG: Failed to send notification for chat handoff -> " + e.getMessage());
            }
        }

        // 3. Build Dynamic Omni-Context Based on Role
        StringBuilder omniContext = new StringBuilder();
        omniContext.append(String.format("The current user is logged in as %s. Their name is %s. ", role, userName));

        try {
            // 3.1 Fetch Today's Leaves (For Admin / SuperAdmin stats)
            String todaySummary = "";
            if("ADMIN".equals(role) || "SUPERADMIN".equals(role)) {
                java.time.LocalDate today = java.time.LocalDate.now();
                List<LeaveRequest> todayLeaves = leaveRequestRepository.findByFromDateLessThanEqualAndToDateGreaterThanEqual(today, today);
                
                long approvedCount = todayLeaves.stream().filter(l -> "APPROVED".equals(l.getStatus())).count();
                long pendingCount  = todayLeaves.stream().filter(l -> "PENDING".equals(l.getStatus())).count();
                long wfhCount      = todayLeaves.stream().filter(l -> "WFH".equals(l.getRequestType())).count();
                long onlineCount   = todayLeaves.stream().filter(l -> "ONLINE".equals(l.getRequestType())).count();

                StringBuilder sb = new StringBuilder("--- TODAY'S OPERATIONAL OVERVIEW --- ");
                sb.append(String.format("Total active requests for today (%s): %d. ", today, todayLeaves.size()));
                sb.append(String.format("[Approved: %d | Pending: %d | WFH: %d | Online Permission: %d]. ", approvedCount, pendingCount, wfhCount, onlineCount));
                
                if(!todayLeaves.isEmpty()) {
                    sb.append("Current Applicants today: ");
                    for(LeaveRequest lr : todayLeaves) {
                        String applicant = userRepository.findById(lr.getUserId()).map(User::getName).orElse("Unknown User");
                        sb.append(String.format("[%s: %s (%s) | Status: %s] ", applicant, lr.getRequestType(), lr.getLeaveCategory(), lr.getStatus()));
                    }
                }
                todaySummary = sb.toString();
            }

            switch(role) {
                case "SUPERADMIN":
                    omniContext.append("You have SUPERADMIN (Power User) privileges. You can view all cross-portal data. ");
                    omniContext.append(todaySummary);
                    break;
                case "ADMIN":
                    omniContext.append("You have ADMIN privileges. ");
                    omniContext.append(todaySummary);
                    break;
                case "STUDENT":
                    omniContext.append("You only have STUDENT privileges. Answer ONLY about their specific data. ");
                    // Add Leaves Context
                    if(userId != null) {
                        List<LeaveRequest> myLeaves = leaveRequestRepository.findByUserIdOrderByCreatedAtDesc(userId);
                        omniContext.append("Their Recent Leaves: ");
                        for(int i = 0; i < Math.min(3, myLeaves.size()); i++) {
                            LeaveRequest lr = myLeaves.get(i);
                            omniContext.append(String.format("[ID: %d | Status: %s | Reason: %s | AdminNote: %s] ", 
                                lr.getId(), lr.getStatus(), lr.getReason(), lr.getApprovalNote()));
                        }
                        if(myLeaves.isEmpty()) omniContext.append("No recent leaves. ");

                        // Add Attendance Context
                        List<TrainerMarkedAttendance> attList = attendanceRepository.findByStudentId(userId.intValue());
                        long totalDays = attList.size();
                        long present = attList.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus())).count();
                        long absent = attList.stream().filter(a -> "ABSENT".equalsIgnoreCase(a.getStatus())).count();
                        omniContext.append(String.format("Attendance: Total Days %d, Present %d, Absent %d. ", totalDays, present, absent));
                    }
                    break;
                case "COUNSELOR":
                case "MARKETER":
                case "TRAINER":
                    omniContext.append(String.format("You are speaking to staff (Role: %s). Answer questions related to their workflow.", role));
                    break;
                case "PUBLIC":
                default:
                    omniContext.append("The user is an anonymous public guest.");
                    break;
            }
        } catch (Exception e) {
            System.err.println("DEBUG: Context building failed. " + e.getMessage());
        }

        // 4. Generate AI Prompt
        if (chatClient.isPresent()) {
            try {
                String aiPrompt = String.format(
                    "You are the 'AppTechno Careers' AI Agent. " +
                    "Identity: You represent AppTechno Careers IT/Non-IT Institute. " +
                    "Knowledge: We offer Java Full Stack, Python AI, MERN, and Software Testing. " +
                    "Tone: Professional, helpful, concise, and friendly. " +
                    "--- CORE SECURITY RULES --- " +
                    "1. If the user is PUBLIC and asks about course fees/prices, EXPLICITLY state: 'Fees are negotiable. Please talk directly to our team member' and provide +91 7022928198. " +
                    "2. If the user is STUDENT, COUNSELOR, MARKETER, or TRAINER, you must ONLY answer questions related to their specific role. If they ask about other users or unrelated admin operations, simply reply: 'I am only authorized to discuss your personal profile and role data.' " +
                    "3. If the user asks for a human, call, or whatsapp, say 'I will connect you with a Senior Counselor. Please call or WhatsApp us at +91 7022928198'. " +
                    "4. If the user is PUBLIC and hasn't given their name, politely ask for it and their current status (working/studying). If they ignore it, never ask again. " +
                    "5. [AGENT COMMAND]: If the user is an ADMIN or SUPERADMIN, and they ask you to APPROVE or REJECT a specific Leave ID, you must include EXACTLY this tag in your response: [ACTION:APPROVE_LEAVE_id] or [ACTION:REJECT_LEAVE_id] (e.g., [ACTION:REJECT_LEAVE_53]). " +
                    "--- CONTEXT DATA --- %s " +
                    "User Message: %s. Respond naturally.",
                    omniContext.toString(), message
                );
                
                String rawResponse = chatClient.get().prompt(aiPrompt).call().content();
                if(rawResponse == null) rawResponse = "";

                // 5. Execute Action Parser (Agentic Mutations)
                return executeSystemActions(rawResponse, authentication);

            } catch (Exception e) {
                System.err.println("DEBUG: AI Chat Error: " + e.getMessage());
            }
        }

        return "Thanks for reaching out! AppTechno Careers offers top-tier training. Please call +91 7022928198.";
    }

    private String executeSystemActions(String aiResponse, org.springframework.security.core.Authentication auth) {
        if(aiResponse == null || !aiResponse.contains("[ACTION:")) {
            return aiResponse;
        }

        // Verify Admin Privileges First
        boolean isAdmin = false;
        User currentAdmin = null;
        if(auth != null && auth.getPrincipal() instanceof CustomUserDetails) {
            currentAdmin = ((CustomUserDetails)auth.getPrincipal()).getUser();
            String roleName = currentAdmin.getRole().getRoleName();
            if("ADMIN".equalsIgnoreCase(roleName) || "SUPERADMIN".equalsIgnoreCase(roleName)) {
                isAdmin = true;
            }
        }

        if(!isAdmin) {
            return "I am sorry, but you do not have permission to execute system actions.";
        }

        // Parse Action
        Pattern pattern = Pattern.compile("\\[ACTION:(APPROVE|REJECT)_LEAVE_(\\d+)\\]");
        Matcher matcher = pattern.matcher(aiResponse);
        
        while(matcher.find()) {
            String type = matcher.group(1);
            Long leaveId = Long.parseLong(matcher.group(2));
            String actionNote = "Agentic Action via Chat";

            try {
                LeaveRequest req = leaveRequestRepository.findById(leaveId).orElse(null);
                if(req != null && "PENDING".equalsIgnoreCase(req.getStatus())) {
                    req.setStatus("APPROVE".equals(type) ? "APPROVED" : "REJECTED");
                    req.setApprovedBy(currentAdmin.getId());
                    req.setApprovalNote(actionNote);
                    leaveRequestRepository.save(req);
                    
                    // Note: If APPROVED, Attendance Auto-Sync is ideally done in service layer. 
                    // For now, the chat changes the status successfully.
                }
            } catch (Exception e) {
                System.err.println("Failed Agentic Action DB update: " + e.getMessage());
            }
        }

        // Strip the internal tag so the user doesn't see it
        return aiResponse.replaceAll("\\[ACTION:[^\\]]+\\]", "").trim();
    }

    private String extractName(String message) {
        String[] words = message.split("\\s+");
        for (int i = words.length - 1; i >= 0; i--) {
            String w = words[i].toLowerCase();
            if (!w.equals("am") && !w.equals("is") && !w.equals("i") && !w.equals("my") && !w.equals("name")) {
                return words[i];
            }
        }
        return "friend";
    }
}
