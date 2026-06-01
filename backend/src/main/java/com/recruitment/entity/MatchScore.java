package com.recruitment.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "match_scores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "application_id")
    private Application application;

    private Double score;

    @Column(columnDefinition = "TEXT")
    private String matchedKeywords;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
