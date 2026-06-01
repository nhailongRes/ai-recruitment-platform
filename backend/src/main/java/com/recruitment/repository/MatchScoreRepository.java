package com.recruitment.repository;

import com.recruitment.entity.MatchScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MatchScoreRepository extends JpaRepository<MatchScore, Long> {
    Optional<MatchScore> findByApplicationId(Long applicationId);
}
