-- Fix seed user role to 'user' per acceptance criteria
UPDATE public.profiles
SET role = 'hospede'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'lifestylemoinhos19@gmail.com'
);
