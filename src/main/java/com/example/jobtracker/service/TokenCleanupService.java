package com.example.jobtracker.service;

import com.example.jobtracker.repository.PasswordResetTokenRepository;
import com.example.jobtracker.repository.VerificationTokenRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
 * Tjeneste for periodisk opprydding av utløpte og gamle tokens.
 * <p>
 * Klassen kjøres automatisk etter en fast tidsplan og sletter
 * verifiseringstokens og passordreset-tokens som ikke lenger er relevante.
 */
@Service
public class TokenCleanupService {

    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    /**
     * Oppretter en ny {@code TokenCleanupService}.
     *
     * @param verificationTokenRepository repository for verifiseringstokens
     * @param passwordResetTokenRepository repository for passordreset-tokens
     */
    public TokenCleanupService(VerificationTokenRepository verificationTokenRepository,
                               PasswordResetTokenRepository passwordResetTokenRepository) {
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    /**
     * Rydder opp utløpte og gamle tokens.
     * <p>
     * Jobben kjører hver natt kl. 03:15 server-tid. Utløpte tokens slettes,
     * og brukte tokens beholdes en kort periode for mulig debugging eller retry
     * før de også fjernes.
     */
    @Scheduled(cron = "0 15 3 * * *")
    @Transactional
    public void cleanupTokens() {
        Instant now = Instant.now();

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