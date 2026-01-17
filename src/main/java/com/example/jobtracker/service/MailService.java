package com.example.jobtracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:}")
    private String from;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String to, String link) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject("Bekreft e-post for Jobbsøker-tracker");
        msg.setText("""
                Hei!

                Klikk her for å aktivere brukeren din:
                %s

                Hilsen
                Jobbsøker-tracker
                """.formatted(link));

        // Viktig: Mailgun liker at du setter from eksplisitt
        if (from != null && !from.isBlank()) {
            msg.setFrom(from);
        }

        mailSender.send(msg);
    }
}
