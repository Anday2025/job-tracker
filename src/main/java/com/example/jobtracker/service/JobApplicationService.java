package com.example.jobtracker.service;

import com.example.jobtracker.model.JobApplication;
import com.example.jobtracker.model.Status;
import com.example.jobtracker.model.User;
import com.example.jobtracker.repository.JobApplicationRepository;
import com.example.jobtracker.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class JobApplicationService {

    private final JobApplicationRepository repo;
    private final UserRepository userRepository;

    public JobApplicationService(JobApplicationRepository repo, UserRepository userRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
    }

    // Henter innlogget e-post (fra cookie/JWT via Spring Security)
    private String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        return auth.getName(); // auth.getName() = email
    }

    private User currentUserOrThrow() {
        String email = currentEmail();
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Unauthorized");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<JobApplication> list() {
        User me = currentUserOrThrow();

        return repo.findAllByUser(me).stream()
                .sorted(Comparator.comparing(
                        JobApplication::getDeadline,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .toList();
    }

    public JobApplication create(String company, String role, String link, LocalDate deadline) {
        User me = currentUserOrThrow();

        JobApplication app = new JobApplication();
        app.setCompany(company);
        app.setRole(role);
        app.setLink(link);
        app.setDeadline(deadline);
        app.setStatus(Status.PLANLAGT);

        // ✅ HER binder vi riktig owner
        app.setUser(me);

        return repo.save(app);
    }

    public Optional<JobApplication> updateStatus(long id, Status status) {
        User me = currentUserOrThrow();

        Optional<JobApplication> found = repo.findByIdAndUser(id, me);
        if (found.isEmpty()) return Optional.empty();

        JobApplication app = found.get();
        app.setStatus(status);
        return Optional.of(repo.save(app));
    }

    public boolean delete(long id) {
        User me = currentUserOrThrow();

        Optional<JobApplication> found = repo.findByIdAndUser(id, me);
        if (found.isEmpty()) return false;

        repo.delete(found.get());
        return true;
    }
}
