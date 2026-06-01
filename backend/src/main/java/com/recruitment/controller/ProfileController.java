package com.recruitment.controller;

import com.recruitment.dto.ProfileDTO;
import com.recruitment.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    @PreAuthorize("hasAuthority('CANDIDATE')")
    public ResponseEntity<ProfileDTO> getProfile(Authentication auth) {
        return ResponseEntity.ok(profileService.getProfile(auth.getName()));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('CANDIDATE')")
    public ResponseEntity<ProfileDTO> updateProfile(@RequestBody ProfileDTO dto,
                                                     Authentication auth) {
        return ResponseEntity.ok(profileService.updateProfile(auth.getName(), dto));
    }
}
