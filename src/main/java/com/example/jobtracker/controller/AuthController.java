package com.example.jobtracker.controller;

import com.example.jobtracker.model.User;
import com.example.jobtracker.model.VerificationToken;
import com.example.jobtracker.repository.UserRepository;
import com.example.jobtracker.repository.VerificationTokenRepository;
import com.example.jobtracker.security.JwtService;
import com.example.jobtracker.service.MailService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final VerificationTokenRepository tokenRepo;
    private final MailService mailService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          VerificationTokenRepository tokenRepo,
                          MailService mailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.tokenRepo = tokenRepo;
        this.mailService = mailService;
    }

    public record AuthRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {}

    // Minst 8 tegn, minst én stor bokstav, én liten bokstav og ett tall
    private boolean isStrongPassword(String password) {
        if (password == null) return false;
        return password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$");
    }

    private void setSessionCookie(HttpServletRequest request, HttpServletResponse response, String token) {
        boolean secure = request.isSecure(); // Render = true
        String sameSite = secure ? "None" : "Lax";

        ResponseCookie cookie = ResponseCookie.from("SESSION", token)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void clearSessionCookie(HttpServletRequest request, HttpServletResponse response) {
        boolean secure = request.isSecure();
        String sameSite = secure ? "None" : "Lax";

        ResponseCookie cookie = ResponseCookie.from("SESSION", "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    private String getBaseUrl(HttpServletRequest request) {
        // Render: APP_BASE_URL=https://job-tracker-0qv9.onrender.com
        String baseUrl = System.getenv().getOrDefault("APP_BASE_URL", "").trim();
        if (!baseUrl.isBlank()) return baseUrl;

        // fallback lokal
        String scheme = request.isSecure() ? "https" : "http";
        return scheme + "://" + request.getServerName() + ":" + request.getServerPort();
    }

    // ---------- REGISTER ----------
    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@RequestBody AuthRequest req, HttpServletRequest request) {
        String email = req.email().toLowerCase().trim();

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "E-post er allerede registrert"));
        }

        if (!isStrongPassword(req.password())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Passordkrav: minst 8 tegn, stor/liten bokstav og tall"));
        }

        User u = new User(email, passwordEncoder.encode(req.password()));
        u.setEnabled(false);
        userRepository.save(u);

        // token gyldig i 24 timer
        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(Duration.ofHours(24));
        VerificationToken vt = new VerificationToken(token, u, expiresAt);
        tokenRepo.save(vt);

        String verifyUrl = getBaseUrl(request) + "/api/auth/verify?token=" + token;

        // Hvis mail feiler -> exception -> @Transactional ruller tilbake automatisk
        mailService.sendVerificationEmail(u.getEmail(), verifyUrl);

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Bruker opprettet. Sjekk e-posten din for bekreftelse."
        ));
    }

    // ---------- VERIFY ----------
    @GetMapping("/verify")
    public ResponseEntity<?> verify(@RequestParam String token) {
        VerificationToken vt = tokenRepo.findByToken(token).orElse(null);
        if (vt == null) return ResponseEntity.badRequest().body(Map.of("error", "Ugyldig token"));

        if (vt.isUsed()) return ResponseEntity.badRequest().body(Map.of("error", "Token er allerede brukt"));
        if (vt.getExpiresAt().isBefore(Instant.now())) return ResponseEntity.badRequest().body(Map.of("error", "Token er utløpt"));

        User u = vt.getUser();
        u.setEnabled(true);
        userRepository.save(u);

        vt.setUsed(true);
        tokenRepo.save(vt);

        return ResponseEntity.ok(Map.of("ok", true, "message", "Bruker aktivert. Du kan logge inn nå."));
    }

    // ---------- LOGIN ----------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {
        String email = req.email().toLowerCase().trim();

        User u = userRepository.findByEmail(email).orElse(null);
        if (u == null || !passwordEncoder.matches(req.password(), u.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Feil e-post eller passord"));
        }

        if (!u.isEnabled()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Du må bekrefte e-posten din før du kan logge inn."));
        }

        String token = jwtService.generateToken(u.getEmail());
        setSessionCookie(request, response, token);

        return ResponseEntity.ok(Map.of("email", u.getEmail()));
    }

    // ---------- ME ----------
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(Map.of("email", auth.getName()));
    }

    // ---------- LOGOUT ----------
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        clearSessionCookie(request, response);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
