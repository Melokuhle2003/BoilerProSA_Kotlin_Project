CREATE TABLE IF NOT EXISTS practice_questions (
 id UUID PRIMARY KEY,
 lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
 question TEXT NOT NULL,
 options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
 correct_index INTEGER NOT NULL CHECK(correct_index >= 0),
 explanation TEXT NOT NULL DEFAULT '',
 difficulty TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(difficulty IN ('EASY','MEDIUM','HARD')),
 is_published BOOLEAN NOT NULL DEFAULT TRUE,
 created_by UUID REFERENCES users(id),
 updated_by UUID REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questions_lesson ON practice_questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_questions_published ON practice_questions(is_published);
