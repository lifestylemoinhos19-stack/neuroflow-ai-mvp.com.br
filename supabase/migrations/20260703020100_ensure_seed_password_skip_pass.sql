-- Ensure seed user password is Skip@Pass as per user story acceptance criteria
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass', gen_salt('bf'))
WHERE email = 'lifestylemoinhos19@gmail.com';
