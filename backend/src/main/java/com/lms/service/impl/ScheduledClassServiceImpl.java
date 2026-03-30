package com.lms.service.impl;

import com.lms.entity.ScheduledClass;
import com.lms.repository.ScheduledClassRepository;
import com.lms.service.ScheduledClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ScheduledClassServiceImpl implements ScheduledClassService {

    @Autowired
    private ScheduledClassRepository repository;

    @Override
    public List<ScheduledClass> getAllScheduledClasses() {
        return repository.findAll();
    }

    @Override
    public ScheduledClass scheduleClass(ScheduledClass scheduledClass) throws Exception {

        if (scheduledClass.getEndTime().isBefore(scheduledClass.getStartTime()) ||
            scheduledClass.getEndTime().equals(scheduledClass.getStartTime())) {
            throw new Exception("End time must be after start time");
        }

        if (scheduledClass.getClassDate().isBefore(LocalDate.now())) {
            throw new Exception("Class date cannot be in the past");
        }

        // Prevent overlapping classes for same batch
        List<ScheduledClass> existing =
                repository.findByBatchIdAndClassDate(
                        scheduledClass.getBatchId(),
                        scheduledClass.getClassDate());

        for (ScheduledClass s : existing) {

            boolean conflict =
                    !(scheduledClass.getEndTime().isBefore(s.getStartTime()) ||
                      scheduledClass.getStartTime().isAfter(s.getEndTime()));

            if (conflict) {
                throw new Exception("Time slot conflicts with existing class for this batch");
            }
        }

        return repository.save(scheduledClass);
    }
}