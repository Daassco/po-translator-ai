-- Migration: 20261111082700_init_po_translator.sql
-- Description: Inisialisasi skema Penerjemah PO AI (User Settings, Riwayat Terjemahan, Glosarium Istilah)

-- 1. Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabel Pengaturan Pengguna
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username VARCHAR(100),
  gemini_api_key_encrypted TEXT,
  preferred_model VARCHAR(50) DEFAULT 'gemini-2.5-flash',
  default_target_lang VARCHAR(15) DEFAULT 'id_ID',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pada user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- 3. Tabel Riwayat Terjemahan (Fase 2 & 3)
CREATE TABLE IF NOT EXISTS public.translation_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  source_lang VARCHAR(20) NOT NULL,
  target_lang VARCHAR(20) NOT NULL,
  total_strings INT DEFAULT 0,
  translated_strings INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'completed', -- 'processing', 'completed', 'failed'
  po_header JSONB DEFAULT '{}'::jsonb,
  po_entries JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pada translation_histories
CREATE INDEX IF NOT EXISTS idx_translation_histories_user_id ON public.translation_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_translation_histories_created_at ON public.translation_histories(created_at DESC);

-- 4. Tabel Glosarium Istilah (Fase 5)
CREATE TABLE IF NOT EXISTS public.glossaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_tag VARCHAR(100) DEFAULT 'General',
  source_term VARCHAR(255) NOT NULL,
  target_term VARCHAR(255) NOT NULL,
  is_do_not_translate BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pada glossaries
CREATE INDEX IF NOT EXISTS idx_glossaries_user_id ON public.glossaries(user_id);
CREATE INDEX IF NOT EXISTS idx_glossaries_project_tag ON public.glossaries(project_tag);

-- 5. Aktifkan Row Level Security (RLS)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossaries ENABLE ROW LEVEL SECURITY;

-- 6. Kebijakan RLS (Policy)
-- User Settings
CREATE POLICY "Users can select own settings" ON public.user_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Translation Histories
CREATE POLICY "Users can select own translation histories" ON public.translation_histories
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own translation histories" ON public.translation_histories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own translation histories" ON public.translation_histories
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own translation histories" ON public.translation_histories
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Glossaries
CREATE POLICY "Users can select own glossaries" ON public.glossaries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own glossaries" ON public.glossaries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own glossaries" ON public.glossaries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own glossaries" ON public.glossaries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
