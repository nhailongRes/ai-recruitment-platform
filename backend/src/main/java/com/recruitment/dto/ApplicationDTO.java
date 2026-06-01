package com.recruitment.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApplicationDTO {
    private Long id;
    private Long jobId;
    private String jobTitle;
    private String candidateName;
    private String status;
    private Double matchScore;
    private String matchedKeywords;
}
