-- Add partial index for non-null paired_sensor_id values
CREATE INDEX IF NOT EXISTS idx_user_onboarding_paired_sensor_id
  ON public.user_onboarding (paired_sensor_id)
  WHERE paired_sensor_id IS NOT NULL;

-- Add DELETE RLS policy for user_onboarding
DROP POLICY IF EXISTS "user_onboarding_delete_own" ON public.user_onboarding;
CREATE POLICY "user_onboarding_delete_own" ON public.user_onboarding
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create handle_new_user_onboarding function
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_onboarding (user_id, is_first_access, paired_sensor_id, onboarding_completed_at)
  VALUES (NEW.id, true, NULL, NULL)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for auto-inserting onboarding record
DROP TRIGGER IF EXISTS on_auth_user_created_onboarding ON auth.users;
CREATE TRIGGER on_auth_user_created_onboarding
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_onboarding();
