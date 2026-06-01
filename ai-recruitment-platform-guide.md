# 🚀 AI Recruitment Platform — Hướng Dẫn Hoàn Chỉnh

> **Dành cho Junior Fullstack Developer** | Java Spring Boot + React + Docker + AWS

---

## [1] CẤU TRÚC DỰ ÁN TỔNG THỂ

```
ai-recruitment-platform/
│
├── backend/                          # Spring Boot application
│   ├── src/main/java/com/recruitment/
│   │   ├── config/                   # Cấu hình Security, CORS, Redis
│   │   ├── controller/               # REST API endpoints
│   │   ├── dto/                      # Data Transfer Objects (request/response)
│   │   ├── entity/                   # JPA Entity classes (mapping DB tables)
│   │   ├── exception/                # Xử lý lỗi tập trung
│   │   ├── repository/               # JPA Repository interfaces
│   │   ├── security/                 # JWT filter, UserDetails
│   │   └── service/                  # Business logic
│   ├── src/main/resources/
│   │   └── application.yml           # Cấu hình app (DB, Redis, JWT)
│   ├── Dockerfile                    # Build Docker image cho backend
│   └── pom.xml                       # Maven dependencies
│
├── frontend/                         # React application
│   ├── src/
│   │   ├── api/                      # Axios instances và service calls
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Các trang chính (Login, Dashboard...)
│   │   ├── store/                    # Redux store và slices
│   │   ├── routes/                   # React Router config
│   │   └── theme/                    # MUI theme
│   ├── Dockerfile                    # Build Docker image cho frontend
│   └── package.json
│
├── nginx/
│   └── nginx.conf                    # Proxy config: /api → backend, / → frontend
│
├── monitoring/
│   └── prometheus.yml                # Cấu hình Prometheus scrape
│
├── .github/workflows/
│   └── ci.yml                        # GitHub Actions CI pipeline
│
└── docker-compose.yml                # Chạy tất cả services cùng lúc
```

---

## [2] DATABASE SCHEMA

```sql
-- Bảng người dùng (cả recruiter và candidate dùng chung)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,         -- Đã được bcrypt hash
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,              -- 'RECRUITER' hoặc 'CANDIDATE'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng tin tuyển dụng (do recruiter tạo)
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    recruiter_id BIGINT REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT NOT NULL,          -- Lưu dạng: "java,spring,docker,aws"
    created_at TIMESTAMP DEFAULT NOW()
);

-- Hồ sơ ứng viên (candidate tự điền text)
CREATE TABLE candidate_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id),
    skills TEXT NOT NULL,                   -- Lưu dạng: "java,react,docker"
    experience TEXT,                        -- Mô tả kinh nghiệm làm việc
    education TEXT                          -- Mô tả học vấn
);

-- Đơn ứng tuyển
CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES jobs(id),
    candidate_id BIGINT REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'PENDING',   -- PENDING, REVIEWED, ACCEPTED, REJECTED
    applied_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)            -- Mỗi người chỉ nộp 1 lần cho 1 job
);

-- Điểm phù hợp AI
CREATE TABLE match_scores (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT UNIQUE REFERENCES applications(id),
    score DOUBLE PRECISION NOT NULL,        -- Điểm % từ 0.0 đến 100.0
    matched_keywords TEXT,                  -- Các từ khóa trùng: "java,docker"
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Mối quan hệ:
- `users` ←→ `jobs`: một recruiter có nhiều job (1-N)
- `users` ←→ `candidate_profiles`: một candidate có một profile (1-1)
- `jobs` ←→ `applications`: một job có nhiều đơn (1-N)
- `applications` ←→ `match_scores`: một đơn có một điểm (1-1)

---

## [3] BACKEND — SPRING BOOT

### pom.xml (dependencies chính)

```xml
<dependencies>
    <!-- Spring Boot core -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Spring Security (JWT auth) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <!-- JPA + Hibernate (ORM) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- Redis (cache token blacklist) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>

    <!-- PostgreSQL driver -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
    </dependency>

    <!-- JWT library -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.11.5</version>
    </dependency>

    <!-- Actuator (cho Prometheus monitoring) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>

    <!-- Lombok (giảm boilerplate code) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
</dependencies>
```

---

### application.yml

```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/recruitment_db
    username: postgres
    password: postgres123
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: update        # Tự động tạo/cập nhật bảng khi chạy
    show-sql: true            # In SQL ra console để debug
    properties:
      hibernate:
        format_sql: true

  data:
    redis:
      host: redis
      port: 6379

# Cấu hình JWT
jwt:
  secret: mySecretKey123456789012345678901234567890  # Phải >= 256 bit
  expiration: 86400000  # 24 giờ tính bằng milliseconds

# Mở endpoint actuator cho Prometheus
management:
  endpoints:
    web:
      exposure:
        include: health,prometheus
  endpoint:
    prometheus:
      enabled: true

server:
  port: 8080
```

---

### SecurityConfig.java

```java
package com.recruitment.config;

import com.recruitment.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity           // Bật @PreAuthorize ở controller
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())   // Disable CSRF vì dùng JWT stateless
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Không dùng session
            .authorizeHttpRequests(auth -> auth
                // Các endpoint public (không cần login)
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/actuator/prometheus", "/actuator/health").permitAll()
                // Tất cả endpoint còn lại phải có JWT
                .anyRequest().authenticated()
            )
            // Thêm JWT filter trước filter mặc định của Spring
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();  // Mã hóa password
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

---

### CorsConfig.java

```java
package com.recruitment.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOrigin("http://localhost:3000");  // React dev server
        config.addAllowedOrigin("http://localhost:80");    // Nginx production
        config.addAllowedMethod("*");                      // GET, POST, PUT, DELETE
        config.addAllowedHeader("*");                      // Content-Type, Authorization
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }
}
```

---

### Entity Classes

```java
// User.java
package com.recruitment.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String fullName;

    @Column(nullable = false)
    private String role;  // "RECRUITER" hoặc "CANDIDATE"
}
```

```java
// Job.java
package com.recruitment.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Job {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "recruiter_id")
    private User recruiter;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requiredSkills;  // Lưu dạng "java,spring,docker"

    private LocalDateTime createdAt = LocalDateTime.now();
}
```

```java
// CandidateProfile.java
package com.recruitment.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "candidate_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CandidateProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(columnDefinition = "TEXT")
    private String skills;      // "java,react,docker,aws"

    @Column(columnDefinition = "TEXT")
    private String experience;

    @Column(columnDefinition = "TEXT")
    private String education;
}
```

```java
// Application.java
package com.recruitment.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Application {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "job_id")
    private Job job;

    @ManyToOne
    @JoinColumn(name = "candidate_id")
    private User candidate;

    private String status = "PENDING";

    private LocalDateTime appliedAt = LocalDateTime.now();
}
```

```java
// MatchScore.java
package com.recruitment.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "match_scores")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MatchScore {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "application_id")
    private Application application;

    private Double score;           // Điểm % từ 0.0 đến 100.0

    @Column(columnDefinition = "TEXT")
    private String matchedKeywords; // Các từ trùng: "java,docker"

    private LocalDateTime createdAt = LocalDateTime.now();
}
```

---

### Repository Interfaces

```java
// UserRepository.java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}

// JobRepository.java
public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByRecruiterId(Long recruiterId);
}

// CandidateProfileRepository.java
public interface CandidateProfileRepository extends JpaRepository<CandidateProfile, Long> {
    Optional<CandidateProfile> findByUserId(Long userId);
}

// ApplicationRepository.java
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByJobId(Long jobId);
    List<Application> findByCandidateId(Long candidateId);
    boolean existsByJobIdAndCandidateId(Long jobId, Long candidateId);
}

// MatchScoreRepository.java
public interface MatchScoreRepository extends JpaRepository<MatchScore, Long> {
    Optional<MatchScore> findByApplicationId(Long applicationId);
}
```

---

### DTO Classes

```java
// LoginRequest.java
public record LoginRequest(String email, String password) {}

// LoginResponse.java
public record LoginResponse(String token, String role, String fullName) {}

// RegisterRequest.java
public record RegisterRequest(String email, String password, String fullName, String role) {}

// JobDTO.java
@Data @Builder
public class JobDTO {
    private Long id;
    private String title;
    private String description;
    private String requiredSkills;
    private String recruiterName;
    private LocalDateTime createdAt;
}

// ApplicationDTO.java
@Data @Builder
public class ApplicationDTO {
    private Long id;
    private Long jobId;
    private String jobTitle;
    private String candidateName;
    private String status;
    private Double matchScore;
    private String matchedKeywords;
}
```

---

### JWT Utility

```java
package com.recruitment.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    // Tạo JWT token từ email và role
    public String generateToken(String email, String role) {
        return Jwts.builder()
            .setSubject(email)
            .claim("role", role)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getKey())
            .compact();
    }

    // Lấy email từ token
    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    // Kiểm tra token còn hợp lệ không
    public boolean isTokenValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(getKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }

    private Key getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}
```

---

### JwtAuthFilter.java

```java
package com.recruitment.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        // Lấy header Authorization: "Bearer <token>"
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        // Tách token ra khỏi "Bearer "
        String token = authHeader.substring(7);

        if (jwtUtil.isTokenValid(token)) {
            String email = jwtUtil.extractEmail(token);
            var userDetails = userDetailsService.loadUserByUsername(email);

            // Đưa thông tin user vào SecurityContext để Spring biết ai đang gọi API
            var authToken = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        chain.doFilter(request, response);
    }
}
```

---

### MatchingService.java ⭐ (Core AI Feature)

```java
package com.recruitment.service;

import com.recruitment.entity.*;
import com.recruitment.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchingService {

    private final CandidateProfileRepository profileRepo;
    private final JobRepository jobRepo;
    private final MatchScoreRepository matchScoreRepo;

    /**
     * Tính điểm phù hợp giữa ứng viên và công việc.
     * Thuật toán: đếm số keyword trùng nhau / tổng keyword của job * 100
     */
    public MatchScore calculateAndSave(Application application) {

        // Bước 1: Lấy hồ sơ ứng viên
        CandidateProfile profile = profileRepo
            .findByUserId(application.getCandidate().getId())
            .orElseThrow(() -> new RuntimeException("Chưa có hồ sơ ứng viên"));

        // Bước 2: Lấy thông tin công việc
        Job job = application.getJob();

        // Bước 3: Tách kỹ năng của ứng viên thành Set (loại trùng lặp)
        // Ví dụ: "Java, Spring Boot, Docker" → ["java", "spring", "boot", "docker"]
        Set<String> candidateKeywords = extractKeywords(
            profile.getSkills() + " " + profile.getExperience()
        );

        // Bước 4: Tách yêu cầu của job thành Set
        Set<String> jobKeywords = extractKeywords(
            job.getRequiredSkills() + " " + job.getDescription()
        );

        // Bước 5: Tìm các keyword trùng nhau
        Set<String> matched = new HashSet<>(candidateKeywords);
        matched.retainAll(jobKeywords);  // Chỉ giữ lại những từ có trong cả 2

        // Bước 6: Tính điểm %
        // Ví dụ: job cần 10 keyword, candidate match 7 → score = 70.0
        double score = jobKeywords.isEmpty() ? 0 :
            (double) matched.size() / jobKeywords.size() * 100;

        // Bước 7: Làm tròn 1 chữ số thập phân
        score = Math.round(score * 10.0) / 10.0;

        // Bước 8: Lưu vào database
        MatchScore matchScore = MatchScore.builder()
            .application(application)
            .score(score)
            .matchedKeywords(String.join(",", matched))
            .build();

        return matchScoreRepo.save(matchScore);
    }

    /**
     * Tách chuỗi text thành Set các keyword lowercase.
     * Loại bỏ ký tự đặc biệt, split theo space/comma.
     * Ví dụ: "Java, Spring Boot, REST API" → ["java", "spring", "boot", "rest", "api"]
     */
    private Set<String> extractKeywords(String text) {
        if (text == null || text.isBlank()) return new HashSet<>();

        return Arrays.stream(
            text.toLowerCase()
                .replaceAll("[^a-z0-9\\s,]", "")  // Chỉ giữ chữ, số, space, dấu phẩy
                .split("[\\s,]+")                   // Split theo space hoặc dấu phẩy
        )
        .filter(word -> word.length() > 2)          // Bỏ từ quá ngắn (a, an, is...)
        .collect(Collectors.toSet());
    }
}
```

---

### AuthService.java

```java
package com.recruitment.service;

import com.recruitment.dto.*;
import com.recruitment.entity.User;
import com.recruitment.repository.UserRepository;
import com.recruitment.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authManager;

    // Đăng ký tài khoản mới
    public void register(RegisterRequest request) {
        if (userRepo.findByEmail(request.email()).isPresent()) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        User user = User.builder()
            .email(request.email())
            .password(passwordEncoder.encode(request.password()))  // Hash password
            .fullName(request.fullName())
            .role(request.role())
            .build();

        userRepo.save(user);
    }

    // Đăng nhập và trả về JWT token
    public LoginResponse login(LoginRequest request) {
        // Spring Security tự kiểm tra email + password
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepo.findByEmail(request.email()).orElseThrow();
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        return new LoginResponse(token, user.getRole(), user.getFullName());
    }
}
```

---

### ApplicationService.java

```java
package com.recruitment.service;

import com.recruitment.entity.*;
import com.recruitment.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository appRepo;
    private final JobRepository jobRepo;
    private final UserRepository userRepo;
    private final MatchingService matchingService;

    // Ứng viên nộp đơn vào job
    public Application apply(Long jobId, Long candidateId) {
        // Kiểm tra đã nộp chưa
        if (appRepo.existsByJobIdAndCandidateId(jobId, candidateId)) {
            throw new RuntimeException("Bạn đã nộp đơn vào công việc này rồi");
        }

        Job job = jobRepo.findById(jobId).orElseThrow();
        User candidate = userRepo.findById(candidateId).orElseThrow();

        // Tạo đơn ứng tuyển
        Application app = Application.builder()
            .job(job)
            .candidate(candidate)
            .status("PENDING")
            .build();

        app = appRepo.save(app);

        // Tự động tính điểm AI sau khi nộp đơn
        matchingService.calculateAndSave(app);

        return app;
    }
}
```

---

### Controllers

```java
// AuthController.java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok("Đăng ký thành công");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
```

```java
// JobController.java
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    // Tất cả mọi người (đã login) đều xem được job list
    @GetMapping
    public ResponseEntity<List<JobDTO>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobDTO> getJob(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJobById(id));
    }

    // Chỉ RECRUITER mới tạo được job
    @PostMapping
    @PreAuthorize("hasAuthority('RECRUITER')")
    public ResponseEntity<JobDTO> createJob(@RequestBody JobDTO dto,
                                             Authentication auth) {
        return ResponseEntity.ok(jobService.createJob(dto, auth.getName()));
    }

    // Recruiter xem danh sách ứng viên của job mình
    @GetMapping("/{jobId}/applications")
    @PreAuthorize("hasAuthority('RECRUITER')")
    public ResponseEntity<List<ApplicationDTO>> getApplications(@PathVariable Long jobId) {
        return ResponseEntity.ok(jobService.getApplicationsForJob(jobId));
    }
}
```

```java
// ApplicationController.java
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService appService;

    // Candidate nộp đơn
    @PostMapping("/apply/{jobId}")
    @PreAuthorize("hasAuthority('CANDIDATE')")
    public ResponseEntity<String> apply(@PathVariable Long jobId,
                                         Authentication auth) {
        // Lấy userId từ JWT token
        Long candidateId = userService.findByEmail(auth.getName()).getId();
        appService.apply(jobId, candidateId);
        return ResponseEntity.ok("Nộp đơn thành công");
    }

    // Candidate xem đơn của mình + điểm match
    @GetMapping("/my-applications")
    @PreAuthorize("hasAuthority('CANDIDATE')")
    public ResponseEntity<List<ApplicationDTO>> myApplications(Authentication auth) {
        return ResponseEntity.ok(appService.getMyApplications(auth.getName()));
    }
}
```

---

### GlobalExceptionHandler.java

```java
package com.recruitment.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Xử lý RuntimeException (lỗi nghiệp vụ)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntime(RuntimeException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }

    // Xử lý lỗi 404
    @ExceptionHandler(jakarta.persistence.EntityNotFoundException.class)
    public ResponseEntity<String> handleNotFound(Exception e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy dữ liệu");
    }
}
```

---

### API Endpoints

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/auth/register` | Public | Đăng ký |
| POST | `/api/auth/login` | Public | Đăng nhập → JWT |
| GET | `/api/jobs` | All | Xem danh sách job |
| GET | `/api/jobs/{id}` | All | Chi tiết job |
| POST | `/api/jobs` | RECRUITER | Tạo job mới |
| GET | `/api/jobs/{id}/applications` | RECRUITER | Xem ứng viên |
| POST | `/api/applications/apply/{jobId}` | CANDIDATE | Nộp đơn |
| GET | `/api/applications/my-applications` | CANDIDATE | Đơn của tôi |
| GET | `/api/profile` | CANDIDATE | Xem hồ sơ |
| PUT | `/api/profile` | CANDIDATE | Cập nhật hồ sơ |

---

## [4] FRONTEND — REACT

### store/index.ts

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import jobReducer from './jobSlice';
import applicationReducer from './applicationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobReducer,
    applications: applicationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

### store/authSlice.ts

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../api/authService';

// Async action: đăng nhập
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await authService.login(credentials);
    // Lưu token vào localStorage để giữ login khi refresh
    localStorage.setItem('token', response.token);
    return response;
  }
);

// Async action: đăng ký
export const register = createAsyncThunk(
  'auth/register',
  async (data: { email: string; password: string; fullName: string; role: string }) => {
    await authService.register(data);
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token') || null,
    role: localStorage.getItem('role') || null,
    fullName: localStorage.getItem('fullName') || null,
    loading: false,
    error: null as string | null,
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.role = null;
      localStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.fullName = action.payload.fullName;
        localStorage.setItem('role', action.payload.role);
        localStorage.setItem('fullName', action.payload.fullName);
      })
      .addCase(login.rejected, (state) => {
        state.loading = false;
        state.error = 'Email hoặc mật khẩu không đúng';
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

---

### api/axiosInstance.ts

```typescript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',  // Nginx sẽ proxy /api → backend:8080
  headers: { 'Content-Type': 'application/json' },
});

// Tự động đính kèm JWT token vào mọi request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Nếu token hết hạn (401), tự động logout
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

---

### pages/LoginPage.tsx

```tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Box, Typography, Paper, Alert } from '@mui/material';
import { login } from '../store/authSlice';
import { AppDispatch, RootState } from '../store';

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      // Redirect theo role
      const role = result.payload.role;
      navigate(role === 'RECRUITER' ? '/recruiter/dashboard' : '/candidate/dashboard');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper elevation={3} sx={{ p: 4, width: 400 }}>
        <Typography variant="h5" mb={3} textAlign="center">Đăng Nhập</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Email" type="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            margin="normal" required
          />
          <TextField
            fullWidth label="Mật khẩu" type="password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            margin="normal" required
          />
          <Button
            fullWidth type="submit" variant="contained"
            sx={{ mt: 2 }} disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
```

---

### components/MatchScoreBadge.tsx

```tsx
import { Chip } from '@mui/material';

interface Props {
  score: number;
}

// Hiển thị badge màu sắc theo điểm match
const MatchScoreBadge = ({ score }: Props) => {
  const getColor = () => {
    if (score >= 70) return 'success';   // Xanh lá: phù hợp cao
    if (score >= 40) return 'warning';   // Vàng: phù hợp trung bình
    return 'error';                       // Đỏ: phù hợp thấp
  };

  return (
    <Chip
      label={`Match: ${score.toFixed(1)}%`}
      color={getColor()}
      size="small"
    />
  );
};

export default MatchScoreBadge;
```

---

### components/ProtectedRoute.tsx

```tsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface Props {
  children: React.ReactNode;
  allowedRole: string;
}

// Redirect về login nếu chưa đăng nhập hoặc sai role
const ProtectedRoute = ({ children, allowedRole }: Props) => {
  const { token, role } = useSelector((state: RootState) => state.auth);

  if (!token) return <Navigate to="/login" />;
  if (role !== allowedRole) return <Navigate to="/unauthorized" />;

  return <>{children}</>;
};

export default ProtectedRoute;
```

---

### App.tsx

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { store } from './store';
import { theme } from './theme/theme';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JobListPage from './pages/JobListPage';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/jobs" element={<JobListPage />} />

            {/* Route chỉ cho RECRUITER */}
            <Route path="/recruiter/dashboard" element={
              <ProtectedRoute allowedRole="RECRUITER">
                <RecruiterDashboard />
              </ProtectedRoute>
            } />

            {/* Route chỉ cho CANDIDATE */}
            <Route path="/candidate/dashboard" element={
              <ProtectedRoute allowedRole="CANDIDATE">
                <CandidateDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
```

---

### theme/theme.ts

```typescript
import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },    // Xanh dương chuyên nghiệp
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none' },
      },
    },
  },
});
```

---

## [5] DOCKER & DEVOPS

### docker-compose.yml

```yaml
version: '3.8'

services:
  # Database PostgreSQL
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: recruitment_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Cache Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Spring Boot Backend
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/recruitment_db
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: postgres123
      SPRING_REDIS_HOST: redis
    depends_on:
      postgres:
        condition: service_healthy

  # React Frontend
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      - frontend

  # Monitoring: Prometheus
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  # Monitoring: Grafana
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    depends_on:
      - prometheus

volumes:
  postgres_data:
```

---

### backend/Dockerfile

```dockerfile
# Stage 1: Build với Maven
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline    # Cache dependencies trước
COPY src ./src
RUN mvn package -DskipTests      # Build JAR, bỏ qua test cho nhanh

# Stage 2: Runtime image nhỏ gọn
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

### frontend/Dockerfile

```dockerfile
# Stage 1: Build React app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci                    # Install dependencies
COPY . .
RUN npm run build             # Build ra thư mục /app/dist

# Stage 2: Serve bằng Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

### nginx/nginx.conf

```nginx
events { worker_connections 1024; }

http {
  server {
    listen 80;

    # /api/* → proxy đến Spring Boot backend
    location /api/ {
      proxy_pass http://backend:8080;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }

    # Tất cả còn lại → React frontend
    location / {
      proxy_pass http://frontend:80;
      try_files $uri $uri/ /index.html;  # Hỗ trợ React Router
    }
  }
}
```

---

### .github/workflows/ci.yml

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Java 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Run backend tests
        working-directory: ./backend
        run: mvn test

      - name: Build backend Docker image
        run: docker build -t recruitment-backend ./backend

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node 20
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install and build frontend
        working-directory: ./frontend
        run: |
          npm ci
          npm run build

      - name: Build frontend Docker image
        run: docker build -t recruitment-frontend ./frontend
```

---

## [6] MONITORING

### monitoring/prometheus.yml

```yaml
global:
  scrape_interval: 15s  # Thu thập metrics mỗi 15 giây

scrape_configs:
  - job_name: 'spring-boot-backend'
    metrics_path: '/actuator/prometheus'  # Endpoint Spring Boot Actuator
    static_configs:
      - targets: ['backend:8080']
```

### Grafana Setup:
1. Mở `http://localhost:3001`, login: `admin/admin`
2. Thêm Prometheus datasource: `http://prometheus:9090`
3. Import dashboard ID **4701** (JVM Micrometer) từ grafana.com
4. Xem CPU, memory, HTTP request metrics ngay lập tức

---

## [7] HƯỚNG DẪN CHẠY DỰ ÁN

```bash
# 1. Clone project
git clone https://github.com/yourusername/ai-recruitment-platform
cd ai-recruitment-platform

# 2. Chạy toàn bộ hệ thống bằng Docker Compose
docker-compose up --build

# 3. Truy cập:
# Frontend:   http://localhost
# Backend:    http://localhost/api
# Grafana:    http://localhost:3001
# Prometheus: http://localhost:9090

# 4. Dừng hệ thống
docker-compose down

# 5. Xóa cả data (reset DB)
docker-compose down -v
```

### Chạy riêng lẻ để dev:

```bash
# Backend
cd backend
mvn spring-boot:run

# Frontend
cd frontend
npm install
npm run dev   # http://localhost:5173
```

---

## AWS Architecture (Thiết kế, không cần deploy thật)

```
Internet
    ↓
[Route 53 DNS]
    ↓
[CloudFront CDN] ← Static assets
    ↓
[Application Load Balancer]
    ↓
[ECS Fargate]
├── Backend containers (Spring Boot)
└── Frontend containers (Nginx + React)
    ↓
[RDS PostgreSQL] + [ElastiCache Redis]
    ↓
[CloudWatch Logs + Metrics]
```

> Ghi chú trong README: "Designed for AWS ECS + RDS deployment. Local development uses Docker Compose."

---

*Happy coding! 🚀 Dự án này đủ để impress trong buổi interview tại Ryujin Group và các công ty khác.*
