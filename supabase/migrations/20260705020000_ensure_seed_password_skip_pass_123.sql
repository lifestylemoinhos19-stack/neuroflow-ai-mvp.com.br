-- Ensure seed user password is Skip@Pass123 per acceptance criteria
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass123', gen_salt('bf'))
WHERE email = 'lifestylemoinhos19@gmail.com';
