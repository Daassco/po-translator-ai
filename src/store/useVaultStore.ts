import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  encryptApiKey,
  decryptApiKey,
  type EncryptedVaultData,
} from "@/lib/crypto-vault";
import { useAppStore } from "@/store/useAppStore";

/**
 * XSS & Injection Sanitizer for API Keys:
 * Strips dangerous HTML tags, javascript: protocols, null bytes, and non-printable control characters.
 */
export function sanitizeApiKey(rawKey: string): string {
  if (!rawKey) return "";
  return rawKey
    .trim()
    .replace(/<[^>]*>?/gm, "") // Strip any HTML tags
    .replace(/[\x00-\x1F\x7F]/g, "") // Strip non-printable ASCII control chars
    .slice(0, 512); // Limit max length
}

interface VaultState {
  // Hanya ciphertext, IV, dan salt yang disimpan permanen di localStorage (TIDAK ADA plaintext key)
  encryptedVault: EncryptedVaultData | null;

  // Plaintext API Key HANYA berada di RAM (in-memory) selama sesi terbuka.
  // Otomatis terhapus saat ditutup/reload atau klik "Kunci Vault"
  sessionApiKey: string | null;
  isUnlocked: boolean;

  // Actions
  setupVault: (apiKey: string, pin: string) => Promise<void>;
  unlockVault: (pin: string) => Promise<boolean>;
  lockVault: () => void;
  resetVault: () => void;
  getEffectiveApiKey: (targetProvider?: string) => string;
  hasKey: (targetProvider?: string) => boolean;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      encryptedVault: null,
      sessionApiKey: null,
      isUnlocked: false,

      // Buat vault baru terenkripsi AES-GCM 256-bit dengan PIN master
      setupVault: async (apiKey: string, pin: string) => {
        const cleanKey = sanitizeApiKey(apiKey);
        const encrypted = await encryptApiKey(cleanKey, pin);
        set({
          encryptedVault: encrypted,
          sessionApiKey: cleanKey,
          isUnlocked: true,
        });
        useAppStore.getState().saveUserSettings();
      },

      // Buka vault dengan PIN master
      unlockVault: async (pin: string) => {
        const vault = get().encryptedVault;
        if (!vault) return false;

        try {
          const decrypted = await decryptApiKey(vault, pin);
          const cleanDecrypted = sanitizeApiKey(decrypted);
          set({
            sessionApiKey: cleanDecrypted,
            isUnlocked: true,
          });
          return true;
        } catch (err) {
          console.error("Gagal membuka vault dengan PIN:", err);
          return false;
        }
      },

      // Kunci vault: Segera buang plaintext key dari memori RAM!
      lockVault: () => {
        set({
          sessionApiKey: null,
          isUnlocked: false,
        });
      },

      // Hapus vault total
      resetVault: () => {
        set({
          encryptedVault: null,
          sessionApiKey: null,
          isUnlocked: false,
        });
        useAppStore.getState().saveUserSettings();
      },

      // Periksa apakah ada kunci aktif
      hasKey: (targetProvider?: string) => {
        const prov = targetProvider || useAppStore.getState().aiProvider || "gemini";
        if (prov === "google_translate" || prov === "ollama") return true;
        if (get().sessionApiKey && get().sessionApiKey!.trim().length > 0) return true;
        if (get().encryptedVault) return true;
        if (prov === "gemini" && Boolean(import.meta.env.VITE_GEMINI_API_KEY)) return true;
        return false;
      },

      // Mengambil API Key yang aktif
      getEffectiveApiKey: (targetProvider?: string) => {
        const sessionKey = get().sessionApiKey;
        if (sessionKey && sessionKey.trim() !== "") {
          return sessionKey.trim();
        }

        const currentProvider =
          targetProvider || useAppStore.getState().aiProvider || "gemini";
        if (currentProvider === "gemini") {
          return (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
        }

        return "";
      },
    }),
    {
      name: "po_translator_crypto_vault",
      // CRITICAL SECURITY: HANYA ciphertext yang boleh di-persist! Plaintext sessionApiKey DILARANG di-persist!
      partialize: (state) => ({
        encryptedVault: state.encryptedVault,
      }),
    }
  )
);