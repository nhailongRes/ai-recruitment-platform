package com.recruitment.service;

import com.recruitment.dto.LoginRequest;
import com.recruitment.dto.LoginResponse;
import com.recruitment.dto.RegisterRequest;
import com.recruitment.entity.User;
import com.recruitment.repository.UserRepository;
import com.recruitment.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authManager;

    public void register(RegisterRequest request) {
        if (userRepo.findByEmail(request.email()).isPresent()) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        User user = User.builder()
            .email(request.email())
            .password(passwordEncoder.encode(request.password()))
            .fullName(request.fullName())
            .role(request.role())
            .build();

        userRepo.save(user);
    }

    public LoginResponse login(LoginRequest request) {
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepo.findByEmail(request.email()).orElseThrow();
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        return new LoginResponse(token, user.getRole(), user.getFullName());
    }
}
