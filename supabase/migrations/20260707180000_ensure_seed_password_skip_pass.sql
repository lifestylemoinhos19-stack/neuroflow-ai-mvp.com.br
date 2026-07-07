-- Ensure seed user password is Skip@Pass per user story acceptance criteria
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'lifestylemoinhos19@gmail.com';

-- Ensure admin role and privacy consent
UPDATE public.profiles
SET role = 'admin',
    privacy_consent = true,
    privacy_consent_accepted_at = COALESCE(privacy_consent_accepted_at, NOW())
WHERE id = (SELECT id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com');
