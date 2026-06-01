package com.recruitment.security;

import com.recruitment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user: " + email));

        return new org.springframework.security.core.userdetails.User(
            user.getEmail(),
            user.getPassword(),
            List.of(new SimpleGrantedAuthority(user.getRole()))
        );
    }
}
