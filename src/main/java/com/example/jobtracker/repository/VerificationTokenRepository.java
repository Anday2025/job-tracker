package com.example.jobtracker.repository;

import com.example.jobtracker.model.User;
import com.example.jobtracker.model.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

/**
 * Repository for håndtering av {@link VerificationToken}-entiteter.
 * <p>
 * Brukes for å validere e-postverifisering og håndtere
 * token-livssyklus.
 */
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, String> {

    /**
     * Finner verifiseringstoken for en spesifikk bruker.
     * <p>
     * Brukes ved resend-verification for å oppdatere eksisterende token.
     *
     * @param user brukeren tokenet tilhører
     * @return valgfri token dersom funnet
     */
    Optional<VerificationToken> findByUser(User user);

    /**
     * Sletter alle tokens som er utløpt før gitt tidspunkt.
     *
     * @param now nåværende tidspunkt
     * @return antall slettede rader
     */
    long deleteByExpiresAtBefore(Instant now);

    /**
     * Sletter tokens som er brukt og samtidig utløpt før gitt tidspunkt.
     *
     * @param cutoff tidspunkt for opprydding
     * @return antall slettede rader
     */
    long deleteByUsedTrueAndExpiresAtBefore(Instant cutoff);
}