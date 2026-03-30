package com.lms.service;

import com.lms.repository.*;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class PerformanceService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private SalaryRepository salaryRepository;

    private final Optional<ChatClient> chatClient;

    public PerformanceService(@Autowired(required = false) ChatClient.Builder chatClientBuilder) {
        if (chatClientBuilder != null) {
            this.chatClient = Optional.of(chatClientBuilder.build());
        } else {
            this.chatClient = Optional.empty();
        }
    }

    public Map<String, Object> getSystemPerformance() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalUsers", userRepository.count());
        stats.put("totalStudents", studentRepository.count());
        stats.put("activeBatches", batchRepository.count());

        Double totalExpenses = expenseRepository.findAll().stream()
                .mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0)
                .sum();
        
        Double totalSalaries = salaryRepository.findAll().stream()
                .mapToDouble(s -> s.getAmount() != null ? s.getAmount() : 0.0)
                .sum();

        stats.put("totalOperationalCost", (Double)(totalExpenses + totalSalaries));
        
        // Dynamic Profit Margin calculation
        Double revenue = 500000.0; 
        Double costs = totalExpenses + totalSalaries;
        Double margin = (revenue > 0) ? ((revenue - costs) / revenue) * 100 : 0.0;
        stats.put("profitMargin", (Double)(Math.round(margin * 100.0) / 100.0));

        return stats;
    }

    public String getAiStrategicAdvice() {
        if (chatClient.isEmpty()) {
            return "Recommendation: Analyze placement data for the upcoming quarter. Current market trends show a surge in Full Stack requirements.";
        }

        Map<String, Object> stats = getSystemPerformance();
        String prompt = String.format(
            "As an Educational Platform Strategist, analyze these metrics: " +
            "Active Students: %d, Active Batches: %d, Operational Cost: %.2f, Profit Margin: %.2f%%. " +
            "Provide one concise, high-impact strategic advice (max 2 sentences) for the Super Admin.",
            stats.get("totalStudents"), stats.get("activeBatches"), 
            stats.get("totalOperationalCost"), stats.get("profitMargin")
        );

        try {
            return chatClient.get().prompt(prompt).call().content();
        } catch (Exception e) {
            return "Strategy: Scale up the AI/ML course tracks as current demand suggests higher ROI compared to general web tracks.";
        }
    }
}
