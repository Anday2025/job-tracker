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
    private final UserRepository userRepo;

    public JobApplicationService(JobApplicationRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    private User currentUser() {
        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Bruker ikke funnet"));
    }

    public List<JobApplication> list() {
        return repo.findAllByUser(currentUser());
    }

    public JobApplication create(String company, String role, String link, LocalDate deadline) {
        JobApplication app = new JobApplication();
        app.setCompany(company);
        app.setRole(role);
        app.setLink(link);
        app.setDeadline(deadline);
        app.setStatus(Status.PLANLAGT);
        app.setUser(currentUser()); // ⭐ VIKTIG

        return repo.save(app);
    }

    public Optional<JobApplication> updateStatus(long id, Status status) {
        return repo.findByIdAndUser(id, currentUser())
                .map(app -> {
                    app.setStatus(status);
                    return repo.save(app);
                });
    }

    public boolean delete(long id) {
        return repo.findByIdAndUser(id, currentUser())
                .map(app -> {
                    repo.delete(app);
                    return true;
                })
                .orElse(false);
    }
}
