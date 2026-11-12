import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { isEntryTranslated, detectSourceLanguage, type PoFile } from "@/lib/po-parser";
import { supabase, isSupabaseConfigured, type TranslationHistory, type Glossary } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { type AiProvider, getProviderConfig } from "@/lib/ai-providers";

export interface BatchProgress {
  isTranslating: boolean;
  isPaused: boolean;
  currentBatch: number;
  totalBatches: number;
  translatedCount: number;
  totalCount: number;
  errorLog: string[];
}

interface AppState {
  // BYOK Settings
  geminiApiKey: string;
  aiProvider: AiProvider;
  apiBaseUrl: string;
  preferredModel: string;
  isApiConnected: boolean;
  isComboEnabled: boolean;
  comboChain: string[];
  setGeminiApiKey: (key: string) => void;
  setAiProvider: (provider: AiProvider, defaultModel?: string, baseUrl?: string) => void;
  setApiBaseUrl: (url: string) => void;
  setPreferredModel: (model: string) => void;
  setIsApiConnected: (status: boolean) => void;
  setIsComboEnabled: (enabled: boolean) => void;
  setComboChain: (chain: string[]) => void;

  // Active PO Translation Workspace
  currentFileName: string;
  currentPoFile: PoFile | null;
  sourceLang: string;
  targetLang: string;
  setCurrentFile: (name: string, poFile: PoFile, source?: string, target?: string) => void;
  setTargetLang: (lang: string) => void;
  setSourceLang: (lang: string) => void;
  updateEntryMsgstr: (id: number, msgstr: string) => void;
  batchUpdateMsgstr: (updates: Array<{ id: number; msgstr: string }>) => void;
  clearCurrentFile: () => void;

  // Batch Translation Queue
  batchProgress: BatchProgress;
  setBatchProgress: (progress: Partial<BatchProgress>) => void;
  resetBatchProgress: () => void;

  // Guest Mode Local Storage (Fase 2 & 5)
  localHistories: TranslationHistory[];
  addLocalHistory: (history: TranslationHistory) => void;
  deleteLocalHistory: (id: string) => void;
  clearLocalHistories: () => void;
  saveSessionSnapshot: (status?: "completed" | "processing" | "failed") => void;

  localGlossaries: Glossary[];
  addLocalGlossary: (glossary: Omit<Glossary, "id" | "user_id" | "created_at">) => Promise<void>;
  updateLocalGlossary: (id: string, updates: Partial<Glossary>) => Promise<void>;
  deleteLocalGlossary: (id: string) => Promise<void>;
  importLocalGlossaries: (items: Array<Omit<Glossary, "id" | "user_id" | "created_at">>) => Promise<void>;
  syncGlossaries: () => Promise<void>;
  syncUserSettings: () => Promise<void>;
  saveUserSettings: () => Promise<void>;
}

const DEFAULT_GLOSSARIES: Array<Omit<Glossary, "id" | "user_id" | "created_at">> = [
  {
    project_tag: "Open Source Tech",
    source_term: "Commit",
    target_term: "Komit",
    is_do_not_translate: false,
    description: "Tindakan menyimpan perubahan kode ke repositori Git",
    contributor_name: "git-community",
    contributor_avatar: "https://github.com/git.png",
  },
  {
    project_tag: "Open Source Tech",
    source_term: "Pull Request",
    target_term: "Permintaan Tarik (Pull Request)",
    is_do_not_translate: false,
    description: "Permintaan penggabungan kontribusi kode",
    contributor_name: "github-team",
    contributor_avatar: "https://github.com/github.png",
  },
  {
    project_tag: "Branding",
    source_term: "WordPress",
    target_term: "WordPress",
    is_do_not_translate: true,
    description: "Nama sistem manajemen konten",
    contributor_name: "wordpress-org",
    contributor_avatar: "https://github.com/wordpress.png",
  },
  {
    project_tag: "Branding",
    source_term: "GNU Gettext",
    target_term: "GNU Gettext",
    is_do_not_translate: true,
    description: "Sistem lokalisasi software internasional",
    contributor_name: "gnu-foundation",
    contributor_avatar: "https://github.com/gnu.png",
  },
];

const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      console.warn("Storage quota exceeded. Trimming older histories...", e);
      try {
        const parsed = JSON.parse(value);
        if (parsed?.state?.localHistories && parsed.state.localHistories.length > 1) {
          parsed.state.localHistories = parsed.state.localHistories.slice(0, 1);
          localStorage.setItem(name, JSON.stringify(parsed));
        }
      } catch {
        // Fallback
      }
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // BYOK
      geminiApiKey: "",
      aiProvider: "gemini",
      apiBaseUrl: "",
      preferredModel: "gemini-3.8-flash",
      isApiConnected: false,
      setGeminiApiKey: (key) => set({ geminiApiKey: key, isApiConnected: false }),
      setAiProvider: (provider, defaultModel, baseUrl) => {
        const config = getProviderConfig(provider);
        set({
          aiProvider: provider,
          apiBaseUrl: baseUrl ?? config.defaultBaseUrl,
          preferredModel: defaultModel ?? config.defaultModel,
          isApiConnected: false,
        });
      },
      setApiBaseUrl: (url) => set({ apiBaseUrl: url, isApiConnected: false }),
      setPreferredModel: (model) => {
        set({ preferredModel: model });
        get().saveUserSettings();
      },
      setIsApiConnected: (status) => set({ isApiConnected: status }),

      // Fitur Combo Model AI (Auto-Failover saat Limit Tercapai)
      isComboEnabled: true,
      comboChain: [
        "gemini-3.8-flash",
        "gemini-2.5-flash",
        "gemini-3.8-pro",
        "gemini-2.5-pro",
      ],
      setIsComboEnabled: (enabled) => set({ isComboEnabled: enabled }),
      setComboChain: (chain) => set({ comboChain: chain }),

      // Active File Workspace
      currentFileName: "",
      currentPoFile: null,
      sourceLang: "auto",
      targetLang: "id_ID",
      setCurrentFile: (name, poFile, source = "auto", target = "id_ID") => {
        // Automatically check PO header for target language if not English
        const headerLang = poFile.headers["Language"];
        let resolvedTarget = target || "id_ID";
        if (headerLang && !headerLang.toLowerCase().startsWith("en")) {
          resolvedTarget = headerLang;
        }

        // Auto-detect source language from PO entries if available
        let resolvedSource = source;
        const detected = detectSourceLanguage(poFile.entries);
        if (detected !== "auto") {
          resolvedSource = detected;
        } else if (!source || source === "en_US") {
          resolvedSource = "auto";
        }

        set({
          currentFileName: name,
          currentPoFile: poFile,
          sourceLang: resolvedSource,
          targetLang: resolvedTarget,
        });
      },
      setTargetLang: (lang) => {
        set({ targetLang: lang });
        get().saveUserSettings();
      },
      setSourceLang: (lang) => set({ sourceLang: lang }),
      updateEntryMsgstr: (id, msgstr) => {
        const poFile = get().currentPoFile;
        if (!poFile) return;
        const newEntries = poFile.entries.map((entry) =>
          entry.id === id || String(entry.id) === String(id) ? { ...entry, msgstr } : entry
        );
        set({ currentPoFile: { ...poFile, entries: newEntries } });
      },
      batchUpdateMsgstr: (updates) => {
        const poFile = get().currentPoFile;
        if (!poFile || !updates || updates.length === 0) return;

        // Map by multiple key representations (original, string, number) to prevent any type coercion mismatch
        const updateMap = new Map<string | number, string>();
        for (const u of updates) {
          if (u.msgstr !== undefined) {
            updateMap.set(u.id, u.msgstr);
            updateMap.set(String(u.id), u.msgstr);
            const numId = Number(u.id);
            if (!isNaN(numId)) {
              updateMap.set(numId, u.msgstr);
            }
          }
        }

        let updatedCount = 0;
        const newEntries = poFile.entries.map((entry) => {
          const newMsgstr =
            updateMap.get(entry.id) ??
            updateMap.get(String(entry.id)) ??
            (typeof entry.id === "string" ? updateMap.get(Number(entry.id)) : undefined);

          if (newMsgstr !== undefined) {
            updatedCount++;
            return { ...entry, msgstr: newMsgstr };
          }
          return entry;
        });

        console.log(`[batchUpdateMsgstr] Updated ${updatedCount} entries out of ${updates.length} updates`);
        set({ currentPoFile: { ...poFile, entries: newEntries } });
      },
      clearCurrentFile: () => set({ currentFileName: "", currentPoFile: null }),

      // Batch Progress
      batchProgress: {
        isTranslating: false,
        isPaused: false,
        currentBatch: 0,
        totalBatches: 0,
        translatedCount: 0,
        totalCount: 0,
        errorLog: [],
      },
      setBatchProgress: (progress) =>
        set((state) => ({ batchProgress: { ...state.batchProgress, ...progress } })),
      resetBatchProgress: () =>
        set({
          batchProgress: {
            isTranslating: false,
            isPaused: false,
            currentBatch: 0,
            totalBatches: 0,
            translatedCount: 0,
            totalCount: 0,
            errorLog: [],
          },
        }),

      // Local Histories
      localHistories: [],
      addLocalHistory: (history) =>
        set((state) => {
          // If item with same file_name exists, replace it to avoid duplicate storage bloat
          const filtered = state.localHistories.filter(
            (h) => h.id !== history.id && h.file_name !== history.file_name
          );
          return { localHistories: [history, ...filtered].slice(0, 5) };
        }),
      deleteLocalHistory: (id) =>
        set((state) => ({
          localHistories: state.localHistories.filter((h) => h.id !== id),
        })),
      clearLocalHistories: () => set({ localHistories: [] }),

      saveSessionSnapshot: (status = "processing") => {
        const { currentFileName, currentPoFile, sourceLang, targetLang, localHistories } = get();
        if (!currentPoFile || !currentFileName) return;

        const total_strings = currentPoFile.entries.length;
        const translated_strings = currentPoFile.entries.filter((e) => isEntryTranslated(e, targetLang)).length;

        const existing = localHistories.find((h) => h.file_name === currentFileName);

        const snapshot: TranslationHistory = {
          id: existing ? existing.id : "hist-" + Date.now(),
          user_id: useAuthStore.getState().user?.id || "guest",
          file_name: currentFileName,
          source_lang: sourceLang,
          target_lang: targetLang,
          total_strings,
          translated_strings,
          status,
          po_header: currentPoFile.headers,
          po_entries: currentPoFile.entries.map((e) => ({
            id: e.id,
            msgid: e.msgid,
            msgstr: e.msgstr,
            msgctxt: e.msgctxt,
            comments: e.comments,
            flags: e.flags,
          })),
          created_at: existing ? existing.created_at : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const others = localHistories.filter((h) => h.file_name !== currentFileName && h.id !== snapshot.id);
        const updatedHistories = [snapshot, ...others].slice(0, 5);
        set({ localHistories: updatedHistories });

        // Auto sync to Supabase if authenticated
        const user = useAuthStore.getState().user;
        if (isSupabaseConfigured && user) {
          supabase
            .from("translation_histories")
            .upsert(
              {
                user_id: user.id,
                file_name: currentFileName,
                source_lang: sourceLang,
                target_lang: targetLang,
                total_strings,
                translated_strings,
                status,
                po_header: snapshot.po_header,
                po_entries: snapshot.po_entries,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id,file_name" }
            )
            .then(({ error }) => {
              if (error) {
                // If onConflict fails, fallback to simple insert
                supabase
                  .from("translation_histories")
                  .insert({
                    user_id: user.id,
                    file_name: currentFileName,
                    source_lang: sourceLang,
                    target_lang: targetLang,
                    total_strings,
                    translated_strings,
                    status,
                    po_header: snapshot.po_header,
                    po_entries: snapshot.po_entries,
                  })
                  .then(() => {});
              }
            });
        }
      },

      // Local Glossaries
      localGlossaries: DEFAULT_GLOSSARIES.map((item, idx) => ({
        ...item,
        id: `default-${idx}`,
        user_id: "guest",
        created_at: new Date().toISOString(),
      })),
      addLocalGlossary: async (glossary) => {
        const newId = crypto.randomUUID();
        const user = useAuthStore.getState().user;
        const newGlossary: Glossary = {
          ...glossary,
          id: newId,
          user_id: user?.id || "guest",
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          localGlossaries: [newGlossary, ...state.localGlossaries],
        }));

        if (isSupabaseConfigured && user) {
          try {
            await supabase.from("glossaries").insert({
              id: newId,
              user_id: user.id,
              project_tag: glossary.project_tag || "General",
              source_term: glossary.source_term,
              target_term: glossary.target_term,
              is_do_not_translate: Boolean(glossary.is_do_not_translate),
              description: glossary.description || "",
            });
          } catch (err) {
            console.error("Gagal menyimpan glosarium ke Supabase:", err);
          }
        }
      },

      updateLocalGlossary: async (id, updates) => {
        set((state) => ({
          localGlossaries: state.localGlossaries.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));

        const user = useAuthStore.getState().user;
        if (isSupabaseConfigured && user) {
          try {
            const dbUpdates: Record<string, unknown> = {};
            if (updates.project_tag !== undefined) dbUpdates.project_tag = updates.project_tag;
            if (updates.source_term !== undefined) dbUpdates.source_term = updates.source_term;
            if (updates.target_term !== undefined) dbUpdates.target_term = updates.target_term;
            if (updates.is_do_not_translate !== undefined) dbUpdates.is_do_not_translate = updates.is_do_not_translate;
            if (updates.description !== undefined) dbUpdates.description = updates.description;

            if (Object.keys(dbUpdates).length > 0) {
              await supabase.from("glossaries").update(dbUpdates).eq("id", id).eq("user_id", user.id);
            }
          } catch (err) {
            console.error("Gagal memperbarui glosarium di Supabase:", err);
          }
        }
      },

      deleteLocalGlossary: async (id) => {
        set((state) => ({
          localGlossaries: state.localGlossaries.filter((g) => g.id !== id),
        }));

        const user = useAuthStore.getState().user;
        if (isSupabaseConfigured && user) {
          try {
            await supabase.from("glossaries").delete().eq("id", id).eq("user_id", user.id);
          } catch (err) {
            console.error("Gagal menghapus glosarium di Supabase:", err);
          }
        }
      },

      importLocalGlossaries: async (items) => {
        const user = useAuthStore.getState().user;
        const newGlossaries: Glossary[] = items.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
          user_id: user?.id || "guest",
          created_at: new Date().toISOString(),
        }));

        set((state) => ({
          localGlossaries: [...newGlossaries, ...state.localGlossaries],
        }));

        if (isSupabaseConfigured && user && newGlossaries.length > 0) {
          try {
            const rows = newGlossaries.map((g) => ({
              id: g.id,
              user_id: user.id,
              project_tag: g.project_tag || "General",
              source_term: g.source_term,
              target_term: g.target_term,
              is_do_not_translate: Boolean(g.is_do_not_translate),
              description: g.description || "",
            }));
            await supabase.from("glossaries").insert(rows);
          } catch (err) {
            console.error("Gagal mengimpor glosarium ke Supabase:", err);
          }
        }
      },

      // Supabase Cloud Sync: Settings (Zero plaintext - AES-GCM ciphertext only)
      saveUserSettings: async () => {
        const user = useAuthStore.getState().user;
        if (!isSupabaseConfigured || !user) return;

        try {
          const vaultStoreModule = await import("@/store/useVaultStore");
          const encryptedVault = vaultStoreModule.useVaultStore.getState().encryptedVault;
          const vaultJson = encryptedVault ? JSON.stringify(encryptedVault) : null;

          const username =
            user.user_metadata?.user_name ||
            user.user_metadata?.preferred_username ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "contributor";

          await supabase.from("user_settings").upsert(
            {
              user_id: user.id,
              github_username: username,
              gemini_api_key_encrypted: vaultJson,
              preferred_model: get().preferredModel || "gemini-3.8-flash",
              default_target_lang: get().targetLang || "id_ID",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } catch (err) {
          console.error("Gagal menyimpan user_settings ke Supabase:", err);
        }
      },

      syncUserSettings: async () => {
        const user = useAuthStore.getState().user;
        if (!isSupabaseConfigured || !user) return;

        try {
          const { data, error } = await supabase
            .from("user_settings")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (error) {
            console.error("Gagal mengambil user_settings dari Supabase:", error);
            return;
          }

          if (data) {
            const updates: Partial<AppState> = {};
            if (data.preferred_model) updates.preferredModel = data.preferred_model;
            if (data.default_target_lang) updates.targetLang = data.default_target_lang;
            if (Object.keys(updates).length > 0) {
              set(updates);
            }

            // Restore encrypted vault ciphertext from Supabase
            if (data.gemini_api_key_encrypted) {
              try {
                const vaultStoreModule = await import("@/store/useVaultStore");
                const vaultStore = vaultStoreModule.useVaultStore;
                const localVault = vaultStore.getState().encryptedVault;
                if (!localVault) {
                  const parsed = JSON.parse(data.gemini_api_key_encrypted);
                  if (parsed && parsed.ciphertext && parsed.iv && parsed.salt) {
                    vaultStore.setState({ encryptedVault: parsed });
                  }
                }
              } catch (e) {
                console.error("Gagal parse ciphertext vault dari Supabase:", e);
              }
            }
          } else {
            // First time login for this user: initialize user_settings row!
            await get().saveUserSettings();
          }
        } catch (err) {
          console.error("Gagal sync user_settings:", err);
        }
      },

      // Supabase Cloud Sync: Glossaries
      syncGlossaries: async () => {
        const user = useAuthStore.getState().user;
        if (!isSupabaseConfigured || !user) return;

        try {
          const { data, error } = await supabase
            .from("glossaries")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Gagal mengambil glosarium dari Supabase:", error);
            return;
          }

          if (data && data.length > 0) {
            const remoteGlossaries: Glossary[] = data.map((row) => ({
              id: row.id,
              user_id: row.user_id,
              project_tag: row.project_tag || "General",
              source_term: row.source_term,
              target_term: row.target_term,
              is_do_not_translate: Boolean(row.is_do_not_translate),
              description: row.description || "",
              created_at: row.created_at,
              contributor_name: user.user_metadata?.user_name || "saya",
              contributor_avatar: user.user_metadata?.avatar_url,
            }));

            const currentLocal = get().localGlossaries;
            const retainedDefaults = currentLocal.filter((l) => l.id.startsWith("default-"));

            set({
              localGlossaries: [...remoteGlossaries, ...retainedDefaults],
            });
          } else {
            // Remote is empty: Seed initial user glossaries to Supabase!
            const currentLocal = get().localGlossaries.filter((g) => !g.id.startsWith("default-"));
            if (currentLocal.length > 0) {
              const rows = currentLocal.map((g) => ({
                id: g.id.startsWith("local-") ? crypto.randomUUID() : g.id,
                user_id: user.id,
                project_tag: g.project_tag || "General",
                source_term: g.source_term,
                target_term: g.target_term,
                is_do_not_translate: Boolean(g.is_do_not_translate),
                description: g.description || "",
              }));
              await supabase.from("glossaries").insert(rows);
            }
          }
        } catch (err) {
          console.error("Gagal sync glosarium:", err);
        }
      },
    }),
    {
      name: "po-translator-ai-storage",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => {
        // Prevent localStorage quota blowout: keep currentPoFile and limit localHistories duplicates
        const trimmedHistories = (state.localHistories || []).slice(0, 3).map((h) => {
          if (h.po_entries && h.po_entries.length > 1000) {
            return {
              ...h,
              po_entries: h.po_entries.slice(0, 200),
            };
          }
          return h;
        });

        return {
          preferredModel: state.preferredModel,
          aiProvider: state.aiProvider,
          apiBaseUrl: state.apiBaseUrl,
          currentFileName: state.currentFileName,
          currentPoFile: state.currentPoFile,
          localHistories: trimmedHistories,
          localGlossaries: state.localGlossaries,
          sourceLang: state.sourceLang,
          targetLang: state.targetLang,
          isComboEnabled: state.isComboEnabled,
          comboChain: state.comboChain,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state && (!state.aiProvider || state.aiProvider === "gemini")) {
          if (state.preferredModel?.includes("2.0") || state.preferredModel?.includes("1.5")) {
            state.preferredModel = "gemini-3.8-flash";
          }
        }
      },
    }
  )
);
