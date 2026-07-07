INSERT INTO public.system_settings (key, value, updated_at)
VALUES ('branding', '{"showSkipLogo": false}'::jsonb, NOW())
ON CONFLICT (key) DO UPDATE
SET value = '{"showSkipLogo": false}'::jsonb,
    updated_at = NOW();
