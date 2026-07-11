UPDATE auth.users
SET encrypted_password = crypt('Lifestyle@2024', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'lifestylemoinhos19@gmail.com';
