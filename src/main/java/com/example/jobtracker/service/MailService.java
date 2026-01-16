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

    public void sendVerificationEmail(String to, String verifyUrl) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject("Bekreft e-post for Jobbsøker-tracker");
        msg.setText("Klikk lenken for å aktivere brukeren din:\n\n" + verifyUrl);
        mailSender.send(msg);
    }
}
