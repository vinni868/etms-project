package com.lms.service.impl;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.AttendanceHistoryDTO;
import com.lms.entity.TrainerMarkedAttendance;
import com.lms.repository.AttendanceRepository;
import com.lms.service.AttendanceService;

@Service
public class AttendanceServiceImpl implements AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Override
    @Transactional
    public void saveBulkAttendance(List<TrainerMarkedAttendance> attendanceList) {
        if (attendanceList != null && !attendanceList.isEmpty()) {
            attendanceRepository.saveAll(attendanceList);
        }
    }

    @Override
    public List<Map<String, Object>> getExistingAttendance(Integer batchId, LocalDate date) {
        return attendanceRepository.findExistingAttendanceWithDetails(batchId, date);
    }

//    @Override
//    public List<AttendanceHistoryDTO> getAttendanceHistory(Integer batchId, LocalDate from, LocalDate to) {
//        return attendanceRepository.findAttendanceHistory(batchId, from, to);
//    }

    @Override
    public List<TrainerMarkedAttendance> getAttendanceByStudentId(Integer studentId) {
        if (studentId == null) return List.of();
        return attendanceRepository.findByStudentId(studentId);
    }

    @Override
    public List<TrainerMarkedAttendance> getAttendanceByStudentAndBatch(Integer studentId, Integer batchId) {
        if (studentId == null || batchId == null) return List.of();
        return attendanceRepository.findByStudentIdAndBatchId(studentId, batchId);
    }
    
//    @Override
//    public List<Map<String, Object>> getExistingAttendance(Integer batchId, LocalDate date) {
//        // Returns student attendance for batch & date, with studentName & email
//        return attendanceRepository.findExistingAttendanceWithDetails(batchId, date);
//    }

    @Override
    public List<AttendanceHistoryDTO> getAttendanceHistory(Integer batchId, LocalDate from, LocalDate to) {
        return attendanceRepository.findAttendanceHistory(batchId, from, to);
    }
}