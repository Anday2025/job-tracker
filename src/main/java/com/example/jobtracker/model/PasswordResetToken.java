package com.example.jobtracker.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class PasswordResetToken {

    @Id
    private String token;

    @ManyToOne(optional = false)
    private User user;

    private Instant expiresAt;

    private boolean used = false;

    public PasswordResetToken() {}

    public PasswordResetToken(String token, User user, Instant expiresAt) {
        this.token = token;
        this.user = user;
        this.expiresAt = expiresAt;
    }

    public String getToken() { return token; }
    public User getUser() { return user; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
}
