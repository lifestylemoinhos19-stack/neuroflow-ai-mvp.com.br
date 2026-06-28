ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_consent boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_consent_accepted_at timestamptz;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

INSERT INTO public.system_settings (key, value, updated_at) VALUES
('tcle_content', jsonb_build_object(
  'version', '1.0',
  'title', 'Termo de Consentimento Livre e Esclarecido',
  'pillars', jsonb_build_array(
    jsonb_build_object('title', 'Finalidade', 'content', 'Ferramenta de triagem e suporte, não substitui diagnóstico médico.'),
    jsonb_build_object('title', 'Privacidade (LGPD)', 'content', 'Dados sensíveis criptografados e armazenados com segurança.'),
    jsonb_build_object('title', 'Uso de Dados', 'content', 'Anonimização para aprimoramento do modelo de IA.'),
    jsonb_build_object('title', 'Direitos', 'content', 'Direito à interrupção e exclusão de dados a qualquer momento.'),
    jsonb_build_object('title', 'Segurança', 'content', 'Não prescreve medicamentos. Emergências devem buscar atendimento presencial.')
  )
), NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
