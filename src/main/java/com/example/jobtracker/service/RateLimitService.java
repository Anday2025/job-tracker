package com.example.jobtracker.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    public boolean allow(String key, int maxHits, long windowMs) {
        long now = Instant.now().toEpochMilli();
        Deque<Long> q = hits.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (q) {
            while (!q.isEmpty() && (now - q.peekFirst()) > windowMs) q.pollFirst();
            if (q.size() >= maxHits) return false;
            q.addLast(now);
            return true;
        }
    }
}
