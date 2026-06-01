package com.recruitment.service;

import com.recruitment.entity.Application;
import com.recruitment.entity.CandidateProfile;
import com.recruitment.entity.Job;
import com.recruitment.entity.MatchScore;
import com.recruitment.repository.CandidateProfileRepository;
import com.recruitment.repository.MatchScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchingService {

    private final CandidateProfileRepository profileRepo;
    private final MatchScoreRepository matchScoreRepo;

    public MatchScore calculateAndSave(Application application) {

        CandidateProfile profile = profileRepo
            .findByUserId(application.getCandidate().getId())
            .orElseThrow(() -> new RuntimeException("Chưa có hồ sơ ứng viên"));

        Job job = application.getJob();

        Set<String> candidateKeywords = extractKeywords(
            profile.getSkills() + " " + profile.getExperience()
        );

        Set<String> jobKeywords = extractKeywords(
            job.getRequiredSkills() + " " + job.getDescription()
        );

        Set<String> matched = new HashSet<>(candidateKeywords);
        matched.retainAll(jobKeywords);

        double score = jobKeywords.isEmpty() ? 0 :
            (double) matched.size() / jobKeywords.size() * 100;

        score = Math.round(score * 10.0) / 10.0;

        MatchScore matchScore = MatchScore.builder()
            .application(application)
            .score(score)
            .matchedKeywords(String.join(",", matched))
            .build();

        return matchScoreRepo.save(matchScore);
    }

    private Set<String> extractKeywords(String text) {
        if (text == null || text.isBlank()) {
            return new HashSet<>();
        }

        return Arrays.stream(
            text.toLowerCase()
                .replaceAll("[^a-z0-9\\s,]", "")
                .split("[\\s,]+")
        )
        .filter(word -> word.length() > 2)
        .collect(Collectors.toSet());
    }
}
