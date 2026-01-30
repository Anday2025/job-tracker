package com.example.jobtracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class MailgunClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${MAILGUN_API_KEY}")
    private String apiKey;

    @Value("${MAILGUN_DOMAIN}")
    private String domain;

    @Value("${MAILGUN_BASE_URL}")
    private String baseUrl;

    public void sendEmail(String from, String to, String subject, String text) {

        String url = baseUrl + "/v3/" + domain + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", basicAuth("api", apiKey));

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("from", from);
        form.add("to", to);
        form.add("subject", subject);
        form.add("text", text);

        HttpEntity<MultiValueMap<String, String>> request =
                new HttpEntity<>(form, headers);

        try {
            ResponseEntity<String> response =
                    restTemplate.postForEntity(url, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException(
                        "Mailgun failed: HTTP " + response.getStatusCode() +
                                " body=" + response.getBody()
                );
            }

        } catch (HttpStatusCodeException e) {
            throw new RuntimeException(
                    "Mailgun error: HTTP " + e.getStatusCode() +
                            " body=" + e.getResponseBodyAsString(),
                    e
            );
        }
    }

    private String basicAuth(String user, String pass) {
        String token = user + ":" + pass;
        return "Basic " + Base64.getEncoder()
                .encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }
}
