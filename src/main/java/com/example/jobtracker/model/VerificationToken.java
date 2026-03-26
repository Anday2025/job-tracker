package com.example.jobtracker.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Entitet som representerer et token for e-postverifisering.
 * <p>
 * Tokenet brukes for å aktivere en bruker etter registrering.
 * Selve tokenverdien brukes som primærnøkkel.
 */
@Entity
@Table(name = "verification_token")
public class VerificationToken {

    /**
     * Unik tokenverdi brukt som primærnøkkel.
     */
    @Id
    @Column(nullable = false, unique = true, length = 255)
    private String token;

    /**
     * Brukeren tokenet tilhører.
     * <p>
     * En bruker kan ha ett aktivt verifiseringstoken om gangen.
     */
    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * Tidspunktet tokenet utløper.
     */
    @Column(nullable = false)
    private Instant expiresAt;

    /**
     * Angir om tokenet allerede er brukt.
     */
    @Column(nullable = false)
    private boolean used = false;

    /**
     * Standard konstruktør for JPA.
     */
    public VerificationToken() {}

    /**
     * Oppretter et nytt verifiseringstoken.
     *
     * @param token tokenverdi
     * @param user bruker tokenet tilhører
     * @param expiresAt utløpstidspunkt
     */
    public VerificationToken(String token, User user, Instant expiresAt) {
        this.token = token;
        this.user = user;
        this.expiresAt = expiresAt;
    }

    /**
     * Henter tokenverdien.
     *
     * @return tokenverdi
     */
    public String getToken() {
        return token;
    }

    /**
     * Setter tokenverdien.
     *
     * @param token ny tokenverdi
     */
    public void setToken(String token) {
        this.token = token;
    }

    /**
     * Henter brukeren tokenet tilhører.
     *
     * @return bruker
     */
    public User getUser() {
        return user;
    }

    /**
     * Setter brukeren tokenet tilhører.
     *
     * @param user bruker
     */
    public void setUser(User user) {
        this.user = user;
    }

    /**
     * Henter utløpstidspunktet.
     *
     * @return utløpstidspunkt
     */
    public Instant getExpiresAt() {
        return expiresAt;
    }

    /**
     * Setter utløpstidspunktet.
     *
     * @param expiresAt nytt utløpstidspunkt
     */
    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    /**
     * Sjekker om tokenet er brukt.
     *
     * @return {@code true} dersom tokenet er brukt
     */
    public boolean isUsed() {
        return used;
    }

    /**
     * Marker token som brukt eller ubrukt.
     *
     * @param used brukt-status
     */
    public void setUsed(boolean used) {
        this.used = used;
    }
}