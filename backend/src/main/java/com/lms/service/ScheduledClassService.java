package com.lms.service;

import com.lms.entity.ScheduledClass;
import java.util.List;

public interface ScheduledClassService {
    List<ScheduledClass> getAllScheduledClasses();
    ScheduledClass scheduleClass(ScheduledClass scheduledClass) throws Exception;
}