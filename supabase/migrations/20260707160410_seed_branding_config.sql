INSERT INTO public.system_settings (key, value, updated_at)
VALUES ('branding', '{"showSkipLogo": false}'::jsonb, NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
