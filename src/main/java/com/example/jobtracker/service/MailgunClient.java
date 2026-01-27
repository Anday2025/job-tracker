package com.example.jobtracker.service;

import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

@Component
public class MailgunClient {

    private final RestTemplate restTemplate;

    public MailgunClient() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Send e-post via Mailgun HTTP API
     */
    public void sendEmail(String from, String to, String subject, String text) {
        String apiKey = env("MAILGUN_API_KEY");
        String domain = env("MAILGUN_DOMAIN");
        String baseUrl = resolveBaseUrl(System.getenv("MAILGUN_BASE_URL"));

        if (isBlank(apiKey) || isBlank(domain)) {
            throw new RuntimeException("Mailgun er ikke konfigurert (MAILGUN_API_KEY / MAILGUN_DOMAIN mangler).");
        }

        // Riktig Mailgun endpoint:
        // POST https://api.eu.mailgun.net/v3/<domain>/messages
        String url = baseUrl + "/v3/" + domain + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth("api", apiKey); // <- viktig: username må være "api"
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("from", from);
        form.add("to", to);
        form.add("subject", subject);
        form.add("text", text);

        HttpEntity<MultiValueMap<String, String>> req = new HttpEntity<>(form, headers);

        try {
            ResponseEntity<String> res = restTemplate.exchange(url, HttpMethod.POST, req, String.class);

            if (!res.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Mailgun failed: HTTP " + res.getStatusCode().value()
                        + " body=" + res.getBody());
            }
        } catch (RestClientResponseException e) {
            // ✅ Spring 6: bruk getStatusCode().value() (ikke getRawStatusCode)
            throw new RuntimeException(
                    "Mailgun error: HTTP " + e.getStatusCode().value()
                            + " body=" + safeBody(e.getResponseBodyAsString()),
                    e
            );
        } catch (Exception e) {
            throw new RuntimeException("Mailgun request failed: " + e.getMessage(), e);
        }
    }

    // ---------------- helpers ----------------

    private static String resolveBaseUrl(String raw) {
        String v = (raw == null) ? "" : raw.trim();

        // Tillat både: "eu" / "us" / full url
        if (v.equalsIgnoreCase("eu")) return "https://api.eu.mailgun.net";
        if (v.equalsIgnoreCase("us")) return "https://api.mailgun.net";

        if (isBlank(v)) {
            // Default til US hvis ikke satt
            return "https://api.mailgun.net";
        }

        // Hvis de har skrevet "api.eu.mailgun.net" uten https://
        if (!v.startsWith("http://") && !v.startsWith("https://")) {
            return "https://" + v;
        }

        // Fjern evt trailing slash
        if (v.endsWith("/")) v = v.substring(0, v.length() - 1);
        return v;
    }

    private static String env(String key) {
        String v = System.getenv(key);
        return v == null ? "" : v.trim();
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String safeBody(String body) {
        if (body == null) return "";
        // unngå gigantiske logger
        return body.length() > 2000 ? body.substring(0, 2000) + "..." : body;
    }
}
