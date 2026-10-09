CREATE TABLE IF NOT EXISTS lesson_progress (
 id UUID PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
 status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK(status IN ('NOT_STARTED','IN_PROGRESS','COMPLETED')),
 percent INTEGER NOT NULL DEFAULT 0 CHECK(percent >= 0 AND percent <= 100),
 last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 completed_at TIMESTAMPTZ,
 UNIQUE(user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id, last_viewed_at DESC);

CREATE TABLE IF NOT EXISTS question_attempts (
 id UUID PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 question_id UUID NOT NULL REFERENCES practice_questions(id) ON DELETE CASCADE,
 selected_index INTEGER NOT NULL CHECK(selected_index >= 0),
 is_correct BOOLEAN NOT NULL,
 attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON question_attempts(user_id, attempted_at DESC);

CREATE TABLE IF NOT EXISTS mock_attempts (
 id UUID PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 total_questions INTEGER NOT NULL,
 correct_answers INTEGER NOT NULL,
 score_percent INTEGER NOT NULL CHECK(score_percent >= 0 AND score_percent <= 100),
 answers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
 completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mock_attempts_user ON mock_attempts(user_id, completed_at DESC);
