package com.recruitment.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class JobDTO {
    private Long id;
    private String title;
    private String description;
    private String requiredSkills;
    private String recruiterName;
    private LocalDateTime createdAt;
}
