package com.lms.service;

import org.springframework.stereotype.Service;

import com.lms.entity.User;
import com.lms.repository.UserRepository;
import com.lms.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public User createUser(User user) {
        return userRepository.save(user);
    }
}
