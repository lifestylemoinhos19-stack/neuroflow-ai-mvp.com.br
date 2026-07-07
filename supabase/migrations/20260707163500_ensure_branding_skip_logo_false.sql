-- Ensure branding config has showSkipLogo = false for public assessment page
INSERT INTO public.system_settings (key, value, updated_at)
VALUES ('branding', '{"showSkipLogo": false}'::jsonb, NOW())
ON CONFLICT (key) DO UPDATE
SET value = jsonb_set(public.system_settings.value, '{showSkipLogo}', 'false'::jsonb),
    updated_at = NOW();
