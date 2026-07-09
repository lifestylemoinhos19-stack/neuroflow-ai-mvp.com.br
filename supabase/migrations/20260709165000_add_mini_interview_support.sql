ALTER TABLE public.anamnesis_sessions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

DELETE FROM public.anamnesis_responses a
USING public.anamnesis_responses b
WHERE a.id < b.id
  AND a.session_id = b.session_id
  AND a.question_key = b.question_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_anamnesis_responses_session_question
ON public.anamnesis_responses(session_id, question_key);
