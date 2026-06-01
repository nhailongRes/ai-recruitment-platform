package com.recruitment.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileDTO {
    private String skills;
    private String experience;
    private String education;
}
