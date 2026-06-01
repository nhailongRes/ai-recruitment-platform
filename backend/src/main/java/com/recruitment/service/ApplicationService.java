package com.recruitment.service;

import com.recruitment.dto.ApplicationDTO;
import com.recruitment.entity.Application;
import com.recruitment.entity.Job;
import com.recruitment.entity.User;
import com.recruitment.repository.ApplicationRepository;
import com.recruitment.repository.JobRepository;
import com.recruitment.repository.MatchScoreRepository;
import com.recruitment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository appRepo;
    private final JobRepository jobRepo;
    private final UserRepository userRepo;
    private final MatchScoreRepository matchScoreRepo;
    private final MatchingService matchingService;

    public Application apply(Long jobId, Long candidateId) {
        if (appRepo.existsByJobIdAndCandidateId(jobId, candidateId)) {
            throw new RuntimeException("Bạn đã nộp đơn vào công việc này rồi");
        }

        Job job = jobRepo.findById(jobId).orElseThrow();
        User candidate = userRepo.findById(candidateId).orElseThrow();

        Application app = Application.builder()
            .job(job)
            .candidate(candidate)
            .status("PENDING")
            .build();

        app = appRepo.save(app);
        matchingService.calculateAndSave(app);

        return app;
    }

    public List<ApplicationDTO> getMyApplications(String email) {
        User candidate = userRepo.findByEmail(email).orElseThrow();
        return appRepo.findByCandidateId(candidate.getId()).stream()
            .map(this::toDTO)
            .toList();
    }

    private ApplicationDTO toDTO(Application app) {
        var matchScore = matchScoreRepo.findByApplicationId(app.getId()).orElse(null);
        return ApplicationDTO.builder()
            .id(app.getId())
            .jobId(app.getJob().getId())
            .jobTitle(app.getJob().getTitle())
            .candidateName(app.getCandidate().getFullName())
            .status(app.getStatus())
            .matchScore(matchScore != null ? matchScore.getScore() : null)
            .matchedKeywords(matchScore != null ? matchScore.getMatchedKeywords() : null)
            .build();
    }
}
