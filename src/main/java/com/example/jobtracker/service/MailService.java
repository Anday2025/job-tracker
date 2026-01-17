package com.example.jobtracker.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final JavaMailSender mailSender;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String to, String link) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject("Bekreft e-post for Jobbsøker-tracker");
        msg.setText("Hei!\n\nKlikk her for å aktivere brukeren din:\n" + link + "\n\nHilsen Jobbsøker-tracker");

        // valgfritt: setFrom, hvis du har verifisert domene (ellers kan sandbox håndtere)
        // msg.setFrom("Jobbsøker-tracker <postmaster@sandboxXXX.mailgun.org>");

        mailSender.send(msg);
    }
}
