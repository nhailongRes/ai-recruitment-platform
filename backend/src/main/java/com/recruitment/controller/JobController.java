package com.recruitment.controller;

import com.recruitment.dto.ApplicationDTO;
import com.recruitment.dto.JobDTO;
import com.recruitment.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @GetMapping
    public ResponseEntity<List<JobDTO>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobDTO> getJob(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJobById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('RECRUITER')")
    public ResponseEntity<JobDTO> createJob(@RequestBody JobDTO dto,
                                             Authentication auth) {
        return ResponseEntity.ok(jobService.createJob(dto, auth.getName()));
    }

    @GetMapping("/{jobId}/applications")
    @PreAuthorize("hasAuthority('RECRUITER')")
    public ResponseEntity<List<ApplicationDTO>> getApplications(@PathVariable Long jobId) {
        return ResponseEntity.ok(jobService.getApplicationsForJob(jobId));
    }
}
