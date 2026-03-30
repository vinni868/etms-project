package com.lms.controller;

import com.lms.entity.Meeting;
import com.lms.entity.User;
import com.lms.repository.MeetingRepository;
import com.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/superadmin/meetings")
public class MeetingController {

    @Autowired
    private MeetingRepository meetingRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/all")
    public List<Meeting> getAllMeetings() {
        return meetingRepository.findAll();
    }

    @PostMapping("/schedule")
    public ResponseEntity<?> scheduleMeeting(@RequestBody Meeting meeting, @RequestParam Long creatorId) {
        User creator = userRepository.findById(creatorId).orElseThrow();
        meeting.setCreatedBy(creator);
        meeting.setStatus("UPCOMING");
        meetingRepository.save(meeting);
        return ResponseEntity.ok(Map.of("message", "Meeting scheduled successfully"));
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<?> cancelMeeting(@PathVariable Long id) {
        Meeting meeting = meetingRepository.findById(id).orElseThrow();
        meeting.setStatus("CANCELLED");
        meetingRepository.save(meeting);
        return ResponseEntity.ok(Map.of("message", "Meeting cancelled"));
    }
}
