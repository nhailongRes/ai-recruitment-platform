package com.recruitment.service;

import com.recruitment.dto.ProfileDTO;
import com.recruitment.entity.CandidateProfile;
import com.recruitment.entity.User;
import com.recruitment.repository.CandidateProfileRepository;
import com.recruitment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final CandidateProfileRepository profileRepository;
    private final UserRepository userRepository;

    public ProfileDTO getProfile(String email) {
        CandidateProfile profile = getOrCreateProfile(email);
        return toDTO(profile);
    }

    public ProfileDTO updateProfile(String email, ProfileDTO dto) {
        CandidateProfile profile = getOrCreateProfile(email);
        profile.setSkills(dto.getSkills());
        profile.setExperience(dto.getExperience());
        profile.setEducation(dto.getEducation());
        return toDTO(profileRepository.save(profile));
    }

    private CandidateProfile getOrCreateProfile(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return profileRepository.findByUserId(user.getId())
            .orElseGet(() -> profileRepository.save(
                CandidateProfile.builder()
                    .user(user)
                    .skills("")
                    .experience("")
                    .education("")
                    .build()
            ));
    }

    private ProfileDTO toDTO(CandidateProfile profile) {
        return ProfileDTO.builder()
            .skills(profile.getSkills())
            .experience(profile.getExperience())
            .education(profile.getEducation())
            .build();
    }
}
