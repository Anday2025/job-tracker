package com.example.jobtracker.repository;

import com.example.jobtracker.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {

    long deleteByExpiresAtBefore(Instant now);
    long deleteByUsedTrueAndExpiresAtBefore(Instant cutoff);
}
