package com.recruitment.controller;

import com.recruitment.dto.ApplicationDTO;
import com.recruitment.service.ApplicationService;
import com.recruitment.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService appService;
    private final UserService userService;

    @PostMapping("/apply/{jobId}")
    @PreAuthorize("hasAuthority('CANDIDATE')")
    public ResponseEntity<String> apply(@PathVariable Long jobId,
                                         Authentication auth) {
        Long candidateId = userService.findByEmail(auth.getName()).getId();
        appService.apply(jobId, candidateId);
        return ResponseEntity.ok("Nộp đơn thành công");
    }

    @GetMapping("/my-applications")
    @PreAuthorize("hasAuthority('CANDIDATE')")
    public ResponseEntity<List<ApplicationDTO>> myApplications(Authentication auth) {
        return ResponseEntity.ok(appService.getMyApplications(auth.getName()));
    }
}
