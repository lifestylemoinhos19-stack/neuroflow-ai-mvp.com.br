ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS crystals_earned INTEGER DEFAULT 0;
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS master_crystals INTEGER DEFAULT 0;

UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass', gen_salt('bf'))
WHERE email = 'lifestylemoinhos19@gmail.com';
