DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'capture_method'
  ) THEN
    ALTER TABLE public.focus_sessions ADD COLUMN capture_method TEXT DEFAULT 'camera_rppg';
  END IF;
END $$;
