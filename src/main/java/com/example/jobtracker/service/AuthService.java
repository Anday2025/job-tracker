package com.example.jobtracker.service;

import com.example.jobtracker.model.PasswordResetToken;
import com.example.jobtracker.model.User;
import com.example.jobtracker.model.VerificationToken;
import com.example.jobtracker.repository.PasswordResetTokenRepository;
import com.example.jobtracker.repository.UserRepository;
import com.example.jobtracker.repository.VerificationTokenRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Tjeneste for autentiseringsrelatert forretningslogikk.
 * <p>
 * Klassen håndterer opprettelse av brukere som venter på verifisering,
 * utsending av nye verifiseringstokens og opprettelse av tokens for
 * passordtilbakestilling.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Oppretter en ny {@code AuthService}.
     *
     * @param userRepository repository for brukerdata
     * @param verificationTokenRepository repository for verifiseringstokens
     * @param passwordResetTokenRepository repository for passordreset-tokens
     * @param passwordEncoder encoder for sikker hashing av passord
     */
    public AuthService(UserRepository userRepository,
                       VerificationTokenRepository verificationTokenRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Resultatobjekt for en nylig opprettet, ikke-verifisert bruker.
     *
     * @param email brukerens e-postadresse
     * @param token tilhørende verifiseringstoken
     */
    public record PendingVerification(String email, String token) {}

    /**
     * Normaliserer e-postadresse ved å gjøre den lowercase og trimme mellomrom.
     *
     * @param email e-postadressen som skal normaliseres
     * @return normalisert e-postadresse, eller tom streng dersom input er {@code null}
     */
    private String normEmail(String email) {
        return email == null ? "" : email.toLowerCase().trim();
    }

    /**
     * Oppretter en ny bruker som må verifisere e-postadressen sin før innlogging.
     * <p>
     * Metoden:
     * <ul>
     *   <li>normaliserer e-postadressen</li>
     *   <li>sjekker at e-post finnes og ikke allerede er registrert</li>
     *   <li>oppretter bruker med hash'et passord</li>
     *   <li>oppretter et nytt verifiseringstoken med 24 timers gyldighet</li>
     * </ul>
     *
     * @param email brukerens e-postadresse
     * @param rawPassword brukerens passord i klartekst
     * @return et {@link PendingVerification}-objekt med e-post og token
     * @throws IllegalStateException dersom e-post mangler eller allerede er registrert
     */
    @Transactional
    public PendingVerification createPendingUser(String email, String rawPassword) {
        String normalizedEmail = normEmail(email);

        if (normalizedEmail.isBlank()) {
            throw new IllegalStateException("E-post mangler");
        }
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalStateException("E-post er allerede registrert");
        }

        User user = new User(normalizedEmail, passwordEncoder.encode(rawPassword));
        user.setEnabled(false);
        userRepository.save(user);

        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(Duration.ofHours(24));

        VerificationToken vt = new VerificationToken(token, user, expiresAt);
        vt.setUsed(false);
        verificationTokenRepository.save(vt);

        return new PendingVerification(user.getEmail(), token);
    }

    /**
     * Oppretter eller oppdaterer verifiseringstoken for en ikke-aktivert bruker.
     * <p>
     * Hvis brukeren ikke finnes eller allerede er aktivert, returneres tom streng
     * for å unngå å avsløre informasjon om kontoens tilstand.
     *
     * @param email e-postadresse til brukeren
     * @return nytt token, eller tom streng dersom bruker ikke finnes eller allerede er aktiv
     */
    @Transactional
    public String createNewVerificationToken(String email) {
        String normalizedEmail = normEmail(email);

        User user = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (user == null) return "";
        if (user.isEnabled()) return "";

        String newToken = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(Duration.ofHours(24));

        VerificationToken vt = verificationTokenRepository
                .findByUser(user)
                .orElse(null);

        if (vt == null) {
            vt = new VerificationToken(newToken, user, expiresAt);
            vt.setUsed(false);
            verificationTokenRepository.save(vt);
        } else {
            vt.setToken(newToken);
            vt.setExpiresAt(expiresAt);
            vt.setUsed(false);
            verificationTokenRepository.save(vt);
        }

        return newToken;
    }

    /**
     * Oppretter et nytt token for passordtilbakestilling.
     * <p>
     * Hvis brukeren ikke finnes, returneres tom streng for å unngå å avsløre
     * om e-postadressen eksisterer i systemet.
     *
     * @param email e-postadresse til brukeren
     * @return nytt reset-token, eller tom streng dersom bruker ikke finnes
     */
    @Transactional
    public String createPasswordResetToken(String email) {
        String normalizedEmail = normEmail(email);

        User user = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (user == null) return "";

        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(30));

        PasswordResetToken prt = new PasswordResetToken(token, user, expiresAt);
        prt.setUsed(false);
        passwordResetTokenRepository.save(prt);

        return token;
    }
}