// Mapping standard error Supabase ke pesan manusiawi
const ERROR_MESSAGES: Record<string, string> = {
  "23505": "Data ini sudah ada, coba nilai lain.",
  "23503": "Data terkait tidak ditemukan atau masih dipakai data lain.",
  "23502": "Ada field wajib yang belum diisi.",
  "42501": "Anda tidak punya akses untuk melakukan aksi ini.",
  "22P02": "Format data yang dikirim tidak valid.",
  PGRST116: "Data tidak ditemukan.",
  invalid_credentials: "Email atau password salah.",
  email_not_confirmed: "Verifikasi email dulu sebelum login.",
  user_already_exists: "Email sudah terdaftar.",
  over_request_rate_limit: "Terlalu banyak percobaan, coba lagi beberapa saat lagi.",
};

export function getSupabaseErrorMessage(error: unknown): string {
  if (!error) return "Terjadi kesalahan, silakan coba lagi.";

  const errObj = error as { code?: string; message?: string };
  const code = errObj.code;

  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  // Debugging unmapped error
  console.error("[Supabase error - unmapped]", error);
  return "Terjadi kesalahan pada server database. Silakan coba beberapa saat lagi.";
}
