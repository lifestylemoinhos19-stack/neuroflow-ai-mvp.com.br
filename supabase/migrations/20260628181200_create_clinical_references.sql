CREATE TABLE IF NOT EXISTS public.clinical_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  section TEXT NOT NULL,
  code TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}'::text[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_references_source ON public.clinical_references(source);
CREATE INDEX IF NOT EXISTS idx_clinical_references_category ON public.clinical_references(category);
CREATE INDEX IF NOT EXISTS idx_clinical_references_keywords ON public.clinical_references USING gin(keywords);

ALTER TABLE public.clinical_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinical_references_select_authenticated" ON public.clinical_references;
CREATE POLICY "clinical_references_select_authenticated" ON public.clinical_references
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "clinical_references_select_anon" ON public.clinical_references;
CREATE POLICY "clinical_references_select_anon" ON public.clinical_references
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "clinical_references_insert_admin" ON public.clinical_references;
CREATE POLICY "clinical_references_insert_admin" ON public.clinical_references
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "clinical_references_update_admin" ON public.clinical_references;
CREATE POLICY "clinical_references_update_admin" ON public.clinical_references
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
