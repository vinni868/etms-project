package com.lms.controller;

import com.lms.entity.UserQuery;
import com.lms.repository.UserQueryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/queries")
public class UserQueryController {

    @Autowired
    private UserQueryRepository queryRepository;

    @PostMapping("/submit")
    public ResponseEntity<?> submitQuery(@RequestBody UserQuery query) {
        try {
            UserQuery savedQuery = queryRepository.save(query);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Details submitted successfully! Our counselor will contact you soon.",
                "id", savedQuery.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to submit details. Please try again."
            ));
        }
    }
}
