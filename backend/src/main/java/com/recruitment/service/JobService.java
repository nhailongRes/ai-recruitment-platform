package com.recruitment.service;

import com.recruitment.dto.ApplicationDTO;
import com.recruitment.dto.JobDTO;
import com.recruitment.entity.Job;
import com.recruitment.repository.ApplicationRepository;
import com.recruitment.repository.JobRepository;
import com.recruitment.repository.MatchScoreRepository;
import com.recruitment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final MatchScoreRepository matchScoreRepository;

    public List<JobDTO> getAllJobs() {
        return jobRepository.findAll().stream()
            .map(this::toDTO)
            .toList();
    }

    public JobDTO getJobById(Long id) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc"));
        return toDTO(job);
    }

    public JobDTO createJob(JobDTO dto, String recruiterEmail) {
        var recruiter = userRepository.findByEmail(recruiterEmail).orElseThrow();

        Job job = Job.builder()
            .recruiter(recruiter)
            .title(dto.getTitle())
            .description(dto.getDescription())
            .requiredSkills(dto.getRequiredSkills())
            .build();

        return toDTO(jobRepository.save(job));
    }

    public List<ApplicationDTO> getApplicationsForJob(Long jobId) {
        return applicationRepository.findByJobId(jobId).stream()
            .map(app -> {
                var matchScore = matchScoreRepository.findByApplicationId(app.getId()).orElse(null);
                return ApplicationDTO.builder()
                    .id(app.getId())
                    .jobId(app.getJob().getId())
                    .jobTitle(app.getJob().getTitle())
                    .candidateName(app.getCandidate().getFullName())
                    .status(app.getStatus())
                    .matchScore(matchScore != null ? matchScore.getScore() : null)
                    .matchedKeywords(matchScore != null ? matchScore.getMatchedKeywords() : null)
                    .build();
            })
            .toList();
    }

    private JobDTO toDTO(Job job) {
        return JobDTO.builder()
            .id(job.getId())
            .title(job.getTitle())
            .description(job.getDescription())
            .requiredSkills(job.getRequiredSkills())
            .recruiterName(job.getRecruiter().getFullName())
            .createdAt(job.getCreatedAt())
            .build();
    }
}
