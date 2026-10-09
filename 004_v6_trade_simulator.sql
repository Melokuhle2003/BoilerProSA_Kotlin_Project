CREATE TABLE IF NOT EXISTS practical_scenarios (
 id UUID PRIMARY KEY,
 slug TEXT NOT NULL UNIQUE,
 title TEXT NOT NULL,
 category TEXT NOT NULL,
 duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK(duration_minutes BETWEEN 5 AND 180),
 instructions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
 rubric_json JSONB NOT NULL DEFAULT '[]'::jsonb,
 is_published BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS practical_attempts (
 id UUID PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 scenario_id UUID NOT NULL REFERENCES practical_scenarios(id) ON DELETE CASCADE,
 score_percent INTEGER NOT NULL CHECK(score_percent BETWEEN 0 AND 100),
 elapsed_seconds INTEGER NOT NULL DEFAULT 0,
 checklist_json JSONB NOT NULL DEFAULT '[]'::jsonb,
 completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tutor_logs (
 id UUID PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 question TEXT NOT NULL,
 answer TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_practical_attempts_user ON practical_attempts(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutor_logs_user ON tutor_logs(user_id, created_at DESC);
