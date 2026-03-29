package com.example.jobtracker.service;

import org.springframework.stereotype.Service;

/**
 * Tjeneste for utsending av applikasjonsspesifikke e-poster.
 * <p>
 * Klassen bygger meldingsinnhold for verifisering, passordreset og
 * sikkerhetsvarsler, og sender disse via {@link MailgunClient}.
 */
@Service
public class MailService {

    private final MailgunClient mailgunClient;

    /**
     * Oppretter en ny {@code MailService}.
     *
     * @param mailgunClient klient for faktisk e-postutsending
     */
    public MailService(MailgunClient mailgunClient) {
        this.mailgunClient = mailgunClient;
    }

    /**
     * Sender e-post med lenke for kontoverifisering.
     *
     * @param to mottakers e-postadresse
     * @param link verifiseringslenke
     */
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

    /**
     * Sender e-post med lenke for passordtilbakestilling.
     *
     * @param to mottakers e-postadresse
     * @param link lenke for reset av passord
     */
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

    /**
     * Sender varsel om at passordet er endret.
     *
     * @param to mottakers e-postadresse
     */
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