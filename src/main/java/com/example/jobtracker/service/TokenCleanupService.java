package com.example.jobtracker.service;

import com.example.jobtracker.repository.PasswordResetTokenRepository;
import com.example.jobtracker.repository.VerificationTokenRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
public class TokenCleanupService {

    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    public TokenCleanupService(VerificationTokenRepository verificationTokenRepository,
                               PasswordResetTokenRepository passwordResetTokenRepository) {
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    /**
     * Kjører hver natt kl 03:15 (server-tid).
     * Render kan “sove”, men dette er fortsatt beste praksis.
     */
    @Scheduled(cron = "0 15 3 * * *")
    @Transactional
    public void cleanupTokens() {
        Instant now = Instant.now();

        // Behold brukte tokens litt, i tilfelle debugging/retry:
        Instant usedCutoffVerify = now.minus(Duration.ofDays(7));
        Instant usedCutoffReset  = now.minus(Duration.ofDays(2));

        long deletedVerifyExpired = verificationTokenRepository.deleteByExpiresAtBefore(now);
        long deletedVerifyUsedOld = verificationTokenRepository.deleteByUsedTrueAndExpiresAtBefore(usedCutoffVerify);

        long deletedResetExpired  = passwordResetTokenRepository.deleteByExpiresAtBefore(now);
        long deletedResetUsedOld  = passwordResetTokenRepository.deleteByUsedTrueAndExpiresAtBefore(usedCutoffReset);

        System.out.println("[TokenCleanup] deleted verification expired=" + deletedVerifyExpired +
                ", verification used-old=" + deletedVerifyUsedOld +
                ", reset expired=" + deletedResetExpired +
                ", reset used-old=" + deletedResetUsedOld);
    }
}
