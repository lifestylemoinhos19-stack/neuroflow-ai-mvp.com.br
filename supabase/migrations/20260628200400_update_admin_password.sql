UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass2024', gen_salt('bf'))
WHERE email = 'lifestylemoinhos19@gmail.com';
