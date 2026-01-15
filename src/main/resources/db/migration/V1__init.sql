-- USERS
CREATE TABLE IF NOT EXISTS users (
                                     id BIGSERIAL PRIMARY KEY,
                                     email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
    );

-- JOB_APPLICATION
CREATE TABLE IF NOT EXISTS job_application (
                                               id BIGSERIAL PRIMARY KEY,
                                               company VARCHAR(255),
    role VARCHAR(255),
    link VARCHAR(1000),
    deadline DATE,
    status VARCHAR(50),
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_job_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    );

-- Indeks for raskere "mine søknader"
CREATE INDEX IF NOT EXISTS idx_job_application_user_id
    ON job_application(user_id);
