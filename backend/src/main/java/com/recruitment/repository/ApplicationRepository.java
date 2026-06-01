package com.recruitment.repository;

import com.recruitment.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByJobId(Long jobId);
    List<Application> findByCandidateId(Long candidateId);
    boolean existsByJobIdAndCandidateId(Long jobId, Long candidateId);
}
