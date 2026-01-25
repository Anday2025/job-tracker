package com.example.jobtracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final MailgunClient mailgunClient;

    @Value("${MAILGUN_API_KEY:}")
    private String apiKey;

    @Value("${MAILGUN_DOMAIN:}")
    private String domain;

    @Value("${MAIL_FROM:}")
    private String from;

    public MailService(MailgunClient mailgunClient) {
        this.mailgunClient = mailgunClient;
    }

    private void require(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " mangler i Environment (Render)");
        }
    }

    private void requireMailConfig(String to) {
        require(apiKey, "MAILGUN_API_KEY");
        require(domain, "MAILGUN_DOMAIN");
        require(from, "MAIL_FROM");
        require(to, "TO");
    }

    // ✅ Verify e-post (brukes ved register + resend)
    public void sendVerificationEmail(String to, String verifyUrl) {
        requireMailConfig(to);

        String subject = "Bekreft e-post for Jobbsøker-tracker";
        String text = """
                Hei!

                Klikk her for å aktivere brukeren din:
                %s

                Denne linken utløper om 24 timer.

                Hilsen
                Jobbsøker-tracker
                """.formatted(verifyUrl);

        mailgunClient.sendEmail(apiKey, domain, from, to, subject, text);
    }

    // ✅ Forgot password → sender reset link
    public void sendResetPasswordEmail(String to, String resetUrl) {
        requireMailConfig(to);

        String subject = "Reset passord";
        String text = """
                Hei!

                Klikk her for å resette passordet ditt:
                %s

                Denne linken utløper om 30 minutter.

                Hvis du ikke ba om dette, kan du ignorere e-posten.

                Hilsen
                Jobbsøker-tracker
                """.formatted(resetUrl);

        mailgunClient.sendEmail(apiKey, domain, from, to, subject, text);
    }

    // ✅ Etter reset → bekreftelse på e-post
    public void sendPasswordChangedEmail(String to) {
        requireMailConfig(to);

        String subject = "Passord endret ";
        String text = """
                Hei!

                Passordet ditt er nå endret

                Hvis du ikke gjorde dette selv, anbefaler vi at du endrer passordet igjen umiddelbart.

                Hilsen
                Jobbsøker-tracker
                """;

        mailgunClient.sendEmail(apiKey, domain, from, to, subject, text);
    }
}
