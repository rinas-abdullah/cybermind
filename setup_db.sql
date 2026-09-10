-- رِسَاق (Risaq) Database Setup Script
-- Run this script as the postgres user to set up the database manually.
-- This mirrors backend/db.js#createTables() exactly — the app also runs
-- that automatically on boot when DB_TYPE=postgresql, so this script is
-- only needed if you prefer to provision the schema yourself ahead of time.

-- Create the database
CREATE DATABASE risaq;

-- Connect to the database
\c risaq;

-- institutions table
CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    admin_user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB
);

-- users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- learner_profiles table (AI personalization — backend/services/ai/learnerProfileService.js)
CREATE TABLE IF NOT EXISTS learner_profiles (
    user_id VARCHAR(100) PRIMARY KEY,
    profile_data JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- learner_states table (gamification snapshot persistence — backend/data/progress.js)
CREATE TABLE IF NOT EXISTS learner_states (
    user_id INTEGER,
    scenario_id VARCHAR(100),
    progress JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, scenario_id)
);

-- ai_logs table (AI mentor conversation history — backend/data/aiLogs.js)
-- Columns match that module's actual INSERT shape (question/response/
-- user_level/context with a client-generated UUID id).
CREATE TABLE IF NOT EXISTS ai_logs (
    id UUID PRIMARY KEY,
    user_id INTEGER NULL,
    username VARCHAR(100),
    question TEXT,
    response TEXT,
    user_level INTEGER,
    context VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
    ai_prompt TEXT,
    category VARCHAR(100),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- sessions table. No route creates rows here yet (there's no
-- session-management flow implemented) — attempts.session_id and
-- performance_metrics.session_id are deliberately plain, unconstrained
-- identifiers rather than foreign keys into this table, so submitting an
-- attempt doesn't require a session to exist first. Kept for when that
-- flow is built.
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    scenario_id INTEGER REFERENCES scenarios(id) ON DELETE CASCADE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'active',
    ai_interactions_count INTEGER DEFAULT 0
);

-- attempts table
CREATE TABLE IF NOT EXISTS attempts (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    attempt_number INTEGER NOT NULL,
    user_response TEXT,
    is_correct BOOLEAN,
    response_time INTERVAL,
    ai_feedback TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- progress table
CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    scenario_id INTEGER REFERENCES scenarios(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    total_attempts INTEGER DEFAULT 0,
    best_score DECIMAL(5,2),
    average_response_time INTERVAL,
    skills_gained JSONB,
    last_attempt_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, scenario_id)
);

-- performance_metrics table. scenario_id/session_id are the slug-style
-- identifiers used by attackSimulator/backend/data/progress.js (e.g.
-- "network-scanning"), not the auto-increment ids in the `scenarios` table
-- (a separate, AI-generated scenario catalog) — so neither is foreign-keyed.
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    scenario_id VARCHAR(100),
    session_id VARCHAR(100),
    accuracy DECIMAL(5,2),
    avg_response_time INTERVAL,
    difficulty_adjustment INTEGER,
    adaptive_resilience_score DECIMAL(5,2),
    ai_analysis TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- auth_tokens table
CREATE TABLE IF NOT EXISTS auth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100),
    details JSONB,
    ip_address INET,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== Path / module / task learning system (backend/services/pathService.js) =====

CREATE TABLE IF NOT EXISTS paths (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    path_id INTEGER NOT NULL REFERENCES paths(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    expected_output TEXT,
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 10),
    order_index INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS task_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'locked',
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(user_id, task_id)
);

-- AI-generated technical résumé/skills summaries (backend/services/aiCoreService.js)
CREATE TABLE IF NOT EXISTS ai_technical_resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    path_id INTEGER REFERENCES paths(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    source VARCHAR(50),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Raw per-lab interaction signals (backend/services/behavioralFingerprintEngine.js
-- aggregates these into a learner's behavioral fingerprint).
CREATE TABLE IF NOT EXISTS lab_behavior_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lab_id VARCHAR(100) NOT NULL,
    duration_ms INTEGER NOT NULL,
    hints_used INTEGER DEFAULT 0,
    wrong_attempts INTEGER DEFAULT 0,
    command_count INTEGER DEFAULT 0,
    unique_command_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- One row per timed lab run started with Pressure Mode enabled.
CREATE TABLE IF NOT EXISTS pressure_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lab_id VARCHAR(100) NOT NULL,
    time_limit_ms INTEGER NOT NULL,
    completed BOOLEAN NOT NULL,
    remaining_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_scenario ON progress(user_id, scenario_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_modules_path_id ON modules(path_id);
CREATE INDEX IF NOT EXISTS idx_tasks_module_id ON tasks(module_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_user_id ON task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_behavior_events_user_id ON lab_behavior_events(user_id);
CREATE INDEX IF NOT EXISTS idx_pressure_attempts_user_id ON pressure_attempts(user_id);

-- Insert default roles
INSERT INTO roles (name, permissions) VALUES
('admin', '{"read": true, "write": true, "delete": true, "manage_users": true}'),
('instructor', '{"read": true, "write": true, "manage_students": true}'),
('learner', '{"read": true, "write": false}')
ON CONFLICT (name) DO NOTHING;
