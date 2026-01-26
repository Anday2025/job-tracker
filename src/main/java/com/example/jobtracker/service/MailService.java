package com.example.jobtracker.service;

import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final MailgunClient mailgunClient;

    public MailService(MailgunClient mailgunClient) {
        this.mailgunClient = mailgunClient;
    }

    private String env(String key, String fallback) {
        String v = System.getenv(key);
        if (v == null) return fallback;
        v = v.trim();
        return v.isBlank() ? fallback : v;
    }

    private void sendOrThrow(String to, String subject, String text, String html) {
        String apiKey  = env("MAILGUN_API_KEY", "");
        String domain  = env("MAILGUN_DOMAIN", "");
        String baseUrl = env("MAILGUN_BASE_URL", "https://api.mailgun.net"); // ✅ EU: https://api.eu.mailgun.net
        String from    = env("MAIL_FROM", "");

        try {
            mailgunClient.sendEmail(apiKey, baseUrl, domain, from, to, subject, text, html);
        } catch (Exception e) {
            // Dette er meldingen du allerede viser i UI
            throw new RuntimeException("Kunne ikke sende e-post. Sjekk Mailgun settings/region.", e);
        }
    }

    public void sendVerificationEmail(String to, String verifyUrl) {
        String subject = "Bekreft e-posten din";
        String text = "Trykk på lenken for å bekrefte e-posten din:\n\n" + verifyUrl;
        String html =
                "<div style='font-family:system-ui,Segoe UI,Roboto,Arial'>" +
                        "<h2>Bekreft e-posten din</h2>" +
                        "<p>Klikk på knappen under for å bekrefte e-posten din:</p>" +
                        "<p><a href='" + verifyUrl + "' style='display:inline-block;padding:10px 14px;" +
                        "background:#4f46e5;color:#fff;border-radius:10px;text-decoration:none;font-weight:700'>" +
                        "Bekreft e-post</a></p>" +
                        "<p style='color:#666'>Hvis knappen ikke virker, bruk denne lenken:<br/>" +
                        "<a href='" + verifyUrl + "'>" + verifyUrl + "</a></p>" +
                        "</div>";

        sendOrThrow(to, subject, text, html);
    }

    public void sendResetPasswordEmail(String to, String resetUrl) {
        String subject = "Nullstill passord";
        String text = "Trykk på lenken for å nullstille passordet ditt:\n\n" + resetUrl;
        String html =
                "<div style='font-family:system-ui,Segoe UI,Roboto,Arial'>" +
                        "<h2>Nullstill passord</h2>" +
                        "<p>Klikk på knappen under for å lage nytt passord:</p>" +
                        "<p><a href='" + resetUrl + "' style='display:inline-block;padding:10px 14px;" +
                        "background:#0ea5e9;color:#fff;border-radius:10px;text-decoration:none;font-weight:700'>" +
                        "Nullstill passord</a></p>" +
                        "<p style='color:#666'>Hvis knappen ikke virker, bruk denne lenken:<br/>" +
                        "<a href='" + resetUrl + "'>" + resetUrl + "</a></p>" +
                        "</div>";

        sendOrThrow(to, subject, text, html);
    }

    public void sendPasswordChangedEmail(String to) {
        String subject = "Passord endret";
        String text = "Passordet ditt er nettopp endret. Hvis dette ikke var deg, ta kontakt umiddelbart.";
        String html =
                "<div style='font-family:system-ui,Segoe UI,Roboto,Arial'>" +
                        "<h2>Passord endret</h2>" +
                        "<p>Passordet ditt er nettopp endret.</p>" +
                        "<p style='color:#666'>Hvis dette ikke var deg, ta kontakt umiddelbart.</p>" +
                        "</div>";

        sendOrThrow(to, subject, text, html);
    }
}
