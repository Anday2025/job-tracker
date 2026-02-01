package com.example.jobtracker.repository;

import com.example.jobtracker.model.User;
import com.example.jobtracker.model.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    Optional<VerificationToken> findByToken(String token);

    // for resend-verification (oppdater samme rad)
    Optional<VerificationToken> findByUser(User user);

    // cleanup
    long deleteByExpiresAtBefore(Instant now);
    long deleteByUsedTrueAndExpiresAtBefore(Instant cutoff);
}
