package com.example.jobtracker.service;

import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class MailgunClient {

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * baseUrl eksempel:
     *   - https://api.mailgun.net
     *   - https://api.eu.mailgun.net   (EU region)
     */
    public void sendEmail(
            String apiKey,
            String baseUrl,
            String domain,
            String from,
            String to,
            String subject,
            String text,
            String html
    ) {
        if (apiKey == null || apiKey.isBlank()) throw new IllegalArgumentException("MAILGUN_API_KEY mangler");
        if (domain == null || domain.isBlank()) throw new IllegalArgumentException("MAILGUN_DOMAIN mangler");
        if (from == null || from.isBlank()) throw new IllegalArgumentException("MAIL_FROM mangler");
        if (to == null || to.isBlank()) throw new IllegalArgumentException("to mangler");
        if (subject == null) subject = "";
        if (baseUrl == null || baseUrl.isBlank()) baseUrl = "https://api.mailgun.net";

        // Normaliser baseUrl (fjern trailing slash)
        baseUrl = baseUrl.trim();
        while (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);

        String url = baseUrl + "/v3/" + domain.trim() + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setAcceptCharset(java.util.List.of(StandardCharsets.UTF_8));

        // Basic Auth: username="api", password=apiKey
        String basic = "api:" + apiKey.trim();
        String encoded = Base64.getEncoder().encodeToString(basic.getBytes(StandardCharsets.UTF_8));
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + encoded);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("from", from);
        form.add("to", to);
        form.add("subject", subject);

        if (text != null && !text.isBlank()) form.add("text", text);
        if (html != null && !html.isBlank()) form.add("html", html);

        HttpEntity<MultiValueMap<String, String>> req = new HttpEntity<>(form, headers);

        try {
            ResponseEntity<String> res = restTemplate.exchange(url, HttpMethod.POST, req, String.class);

            if (!res.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Mailgun failed: " + res.getStatusCode() + " body=" + res.getBody());
            }
        } catch (RestClientResponseException e) {
            // ✅ getRawStatusCode() => bruk getStatusCode().value()
            int code = e.getStatusCode().value();
            String body = e.getResponseBodyAsString();
            throw new RuntimeException("Mailgun error: HTTP " + code + " body=" + body, e);
        } catch (Exception e) {
            throw new RuntimeException("Mailgun request failed: " + e.getMessage(), e);
        }
    }
}
