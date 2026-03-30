package com.lms.service;

import com.lms.entity.IdSequence;
import com.lms.repository.IdSequenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

@Service
public class IdGeneratorService {

    @Autowired
    private IdSequenceRepository idSequenceRepository;

    @Transactional
    public synchronized String generateId(String portal) {
        return generateId(portal, null);
    }

    @Transactional
    public synchronized String generateId(String portal, String shortcut) {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        int currentYear = now.getYear();
        int currentMonth = now.getMonthValue();

        IdSequence seq = idSequenceRepository.findByPortal(portal)
                .orElseGet(() -> {
                    // Auto-provision if missing (e.g. for COUNSELOR or MARKETER)
                    String defaultPrefix = (portal.length() >= 3) ? portal.substring(0, 3).toUpperCase() : portal.toUpperCase();
                    IdSequence newSeq = new IdSequence(portal, defaultPrefix, 0, java.time.Year.now().getValue());
                    return idSequenceRepository.save(newSeq);
                });

        // Reset sequence if year changed
        if (seq.getYear() != currentYear) {
            seq.setCurrentSeq(0);
            seq.setYear(currentYear);
        }

        // Increment
        seq.setCurrentSeq(seq.getCurrentSeq() + 1);
        seq.setUpdatedAt(now);
        idSequenceRepository.save(seq);

        String effectivePrefix = (shortcut != null && !shortcut.trim().isEmpty()) 
                                 ? shortcut.trim().toUpperCase() 
                                 : seq.getPrefix();

        // New Format: YYYYMMShortcutXXXXX (5 digits)
        // Example: 202510FSP01153
        return String.format("%d%02d%s%05d",
                currentYear,
                currentMonth,
                effectivePrefix,
                seq.getCurrentSeq()
        );
    }
}
