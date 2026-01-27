package com.example.jobtracker.service;

import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final MailgunClient mailgunClient;

    public MailService(MailgunClient mailgunClient) {
        this.mailgunClient = mailgunClient;
    }

    public void sendVerificationEmail(String to, String verifyUrl) {
        String from = mailFrom();
        String subject = "Bekreft e-postadressen din";
        String text =
                "Hei!\n\n" +
                        "Klikk på lenken for å bekrefte e-posten din:\n" +
                        verifyUrl + "\n\n" +
                        "Lenken varer i 24 timer.\n\n" +
                        "Hilsen\nJobbsøker-tracker";
        mailgunClient.sendEmail(from, to, subject, text);
    }

    public void sendResetPasswordEmail(String to, String resetUrl) {
        String from = mailFrom();
        String subject = "Tilbakestill passord";
        String text =
                "Hei!\n\n" +
                        "Klikk på lenken for å velge nytt passord:\n" +
                        resetUrl + "\n\n" +
                        "Lenken varer i 30 minutter.\n\n" +
                        "Hilsen\nJobbsøker-tracker";
        mailgunClient.sendEmail(from, to, subject, text);
    }

    public void sendPasswordChangedEmail(String to) {
        String from = mailFrom();
        String subject = "Passordet ditt er endret";
        String text =
                "Hei!\n\n" +
                        "Passordet ditt ble nettopp endret.\n" +
                        "Hvis dette ikke var deg, bør du endre passordet umiddelbart.\n\n" +
                        "Hilsen\nJobbsøker-tracker";
        mailgunClient.sendEmail(from, to, subject, text);
    }

    private String mailFrom() {
        String from = System.getenv("MAIL_FROM");
        if (from == null || from.trim().isEmpty()) {
            // Fallback: Mailgun krever en gyldig avsender.
            // Hvis du bruker sandbox er postmaster@<sandbox-domain> vanlig.
            String domain = System.getenv("MAILGUN_DOMAIN");
            if (domain != null && !domain.trim().isEmpty()) {
                return "Jobbsøker-tracker <postmaster@" + domain.trim() + ">";
            }
            throw new RuntimeException("MAIL_FROM mangler (og ingen MAILGUN_DOMAIN fallback).");
        }
        return from.trim();
    }
}
