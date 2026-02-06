package com.example.jobtracker.service;

import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final MailgunClient mailgunClient;

    public MailService(MailgunClient mailgunClient) {
        this.mailgunClient = mailgunClient;
    }

    public void sendVerificationEmail(String to, String link) {
        String subject = "Bekreft e-post for jobbsokertracking";
        String text = """
                Hei!

                Klikk her for å aktivere brukeren din:
                %s

                Hilsen
                jobbsokertracking
                """.formatted(link);

        mailgunClient.sendEmail(to, subject, text);
    }

    public void sendResetPasswordEmail(String to, String link) {
        String subject = "Reset passord – jobbsokertracking";
        String text = """
                Hei!

                Klikk her for å resette passordet ditt:
                %s

                Hvis du ikke ba om dette, kan du ignorere e-posten.

                Hilsen
                jobbsokertracking
                """.formatted(link);

        mailgunClient.sendEmail(to, subject, text);
    }

    public void sendPasswordChangedEmail(String to) {
        String subject = "Passord endret – jobbsokertracking";
        String text = """
                Hei!

                Passordet ditt ble nettopp endret.
                Hvis dette ikke var deg, anbefaler vi at du reseter passordet umiddelbart.

                Hilsen
                jobbsokertracking
                """;

        mailgunClient.sendEmail(to, subject, text);
    }
}
