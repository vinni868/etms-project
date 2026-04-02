package com.lms.service;

import com.lms.entity.IdSequence;
import com.lms.repository.IdSequenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Year;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private IdSequenceRepository idSequenceRepository;

    @Override
    public void run(String... args) throws Exception {
        seedIdSequences();
    }

    private void seedIdSequences() {
        if (idSequenceRepository.count() == 0) {
            int currentYear = Year.now().getValue();
            List<IdSequence> sequences = List.of(
                new IdSequence("STUDENT",  "STU", 0, currentYear),
                new IdSequence("TRAINER",  "TRN", 0, currentYear),
                new IdSequence("ADMIN",    "ADM", 0, currentYear),
                new IdSequence("MARKETER", "MKT", 0, currentYear),
                new IdSequence("COUNSELOR", "CNS", 0, currentYear),
                new IdSequence("BATCH",    "BAT", 0, currentYear),
                new IdSequence("COURSE",   "CRS", 0, currentYear),
                new IdSequence("INVOICE",  "INV", 0, currentYear)
            );
            idSequenceRepository.saveAll(sequences);
            System.out.println("✅ Initial ID sequences seeded for year " + currentYear);
        }
    }
}
