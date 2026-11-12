import { createClient } from "@supabase/supabase-js";

export interface UserSettings {
  user_id: string;
  github_username?: string | null;
  gemini_api_key_encrypted?: string | null;
  preferred_model: string;
  default_target_lang: string;
  created_at?: string;
  updated_at?: string;
}

export interface TranslationHistory {
  id: string;
  user_id: string;
  file_name: string;
  source_lang: string;
  target_lang: string;
  total_strings: number;
  translated_strings: number;
  status: "completed" | "processing" | "failed";
  po_header: Record<string, string>;
  po_entries: Array<{
    id: number;
    msgid: string;
    msgstr: string;
    msgctxt?: string;
    comments?: string[];
    flags?: string[];
  }>;
  created_at: string;
  updated_at?: string;
}

export interface Glossary {
  id: string;
  user_id: string;
  project_tag: string;
  source_term: string;
  target_term: string;
  is_do_not_translate: boolean;
  description?: string | null;
  created_at: string;
  contributor_name?: string | null;
  contributor_avatar?: string | null;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes("your-project") &&
  !supabaseAnonKey.includes("your-supabase")
);

// Fallback dummy client if credentials aren't set yet (Guest Mode)
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder-po-ai.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "placeholder-key"
);
