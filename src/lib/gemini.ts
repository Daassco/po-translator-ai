import { GoogleGenAI, Type } from "@google/genai";
import { validatePlaceholders } from "./po-parser";
import { useVaultStore } from "@/store/useVaultStore";
import { useAppStore } from "@/store/useAppStore";
import { type AiProvider, getProviderConfig } from "./ai-providers";
import { translateSingleWithGoogle, translateBatchGoogle } from "./google-translate";
import { validateAndSanitizeBaseUrl } from "./url-validator";

export interface TranslateItem {
  index: number;
  msgid: string;
  context?: string;
}

export interface TranslatedResult {
  index: number;
  msgstr: string;
  hasWarning?: boolean;
  warningDetails?: string;
}

export interface GlossaryTerm {
  source: string;
  target: string;
  dnt: boolean;
}

/**
 * Universal Connectivity Test across Google Gemini & any OpenAI-compatible provider
 */
export async function testAiConnection(
  provider?: AiProvider,
  apiKey?: string,
  modelName?: string,
  baseUrl?: string
): Promise<{ success: boolean; message: string }> {
  const currentProvider = provider || useAppStore.getState().aiProvider || "gemini";
  const config = getProviderConfig(currentProvider);
  const targetModel = modelName || useAppStore.getState().preferredModel || config.defaultModel;
  const targetBaseUrl = (baseUrl !== undefined ? baseUrl : (useAppStore.getState().apiBaseUrl || config.defaultBaseUrl)).replace(/\/+$/, "");
  const effectiveKey = apiKey !== undefined ? apiKey : useVaultStore.getState().getEffectiveApiKey(currentProvider);

  if (config.requiresKey && !effectiveKey) {
    return {
      success: false,
      message: `API Key diperlukan untuk penyedia ${config.name}. Harap masukkan kunci Anda.`,
    };
  }

  // 1. Google Gemini Native SDK
  if (currentProvider === "gemini") {
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveKey });
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: "Ping! Responlah hanya dengan kata 'PONG'.",
      });

      const text = response.text || "";
      if (text.toLowerCase().includes("pong")) {
        return { success: true, message: `Koneksi berhasil! Model ${targetModel} aktif & siap.` };
      }
      return { success: true, message: `Koneksi terhubung ke Google Gemini (${targetModel}).` };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        success: false,
        message: err.message || "Gagal menghubungi Gemini API. Periksa kembali API Key Anda.",
      };
    }
  }

  // 1b. Google Translate Online (Tanpa Kunci, Bebas Kuota 20 RPD)
  if (currentProvider === "google_translate") {
    try {
      const res = await translateSingleWithGoogle("Connection check", "en", "id");
      return {
        success: true,
        message: `Koneksi Google Translate online aktif & responsif ("Connection check" -> "${res.trim()}"). Mesin siap digunakan bebas batas kuota 20 RPD!`,
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        success: false,
        message: err.message || "Gagal menghubungi endpoint Google Translate.",
      };
    }
  }

  // 2. Standard OpenAI-Compatible Endpoints (Ollama, OpenRouter, DeepSeek, Groq, OpenAI, Custom)
  const urlCheck = validateAndSanitizeBaseUrl(targetBaseUrl);
  if (!urlCheck.isValid) {
    return {
      success: false,
      message: `[Keamanan URL] ${urlCheck.error || "Endpoint Base URL tidak aman."}`,
    };
  }

  const endpoint = `${urlCheck.sanitizedUrl}/chat/completions`;
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (effectiveKey && (currentProvider !== "ollama" || effectiveKey.trim() !== "")) {
      headers["Authorization"] = `Bearer ${effectiveKey}`;
    }

    if (currentProvider === "openrouter") {
      headers["HTTP-Referer"] = typeof window !== "undefined" ? window.location.origin : "https://penerjemah-po.local";
      headers["X-Title"] = "Penerjemah PO AI";
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: "user", content: "Ping! Jawab hanya dengan 'PONG'." }],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      const errMsg =
        errorJson?.error?.message ||
        errorJson?.message ||
        `HTTP ${res.status}: ${res.statusText}`;
      return {
        success: false,
        message: `Gagal dari ${config.name}: ${errMsg}`,
      };
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "";
    return {
      success: true,
      message: `Koneksi berhasil! Model ${targetModel} (${config.name}) merespons aktif: "${reply.trim().slice(0, 30)}"`,
    };
  } catch (error: unknown) {
    const err = error as { message?: string; name?: string };
    if (currentProvider === "ollama") {
      return {
        success: false,
        message: `Tidak dapat menghubungi Ollama di ${targetBaseUrl}. Pastikan 'ollama serve' berjalan dan model '${targetModel}' sudah diunduh ('ollama run ${targetModel}').`,
      };
    }
    return {
      success: false,
      message: err.message || `Gagal menghubungi endpoint ${endpoint}. Periksa jaringan atau CORS.`,
    };
  }
}

// Backwards-compatible alias
export const testGeminiConnection = testAiConnection;

/**
 * Detects whether an error is caused by rate-limiting, quota exhaustion, or server overload.
 */
export function isRateLimitError(err: unknown): boolean {
  if (!err) return false;
  const str = (
    typeof err === "string"
      ? err
      : (err as { message?: string; status?: number })?.message || JSON.stringify(err)
  ).toLowerCase();

  return (
    str.includes("429") ||
    str.includes("resource_exhausted") ||
    str.includes("quota") ||
    str.includes("rate limit") ||
    str.includes("rate_limit") ||
    str.includes("too many requests") ||
    str.includes("overloaded") ||
    str.includes("exceeded")
  );
}

/**
 * Handles Combo Failover: If current model hits rate-limit, seamlessly switch to next model in chain.
 */
async function handleComboFailover(
  currentModel: string,
  error: unknown,
  retryFn: (nextModel: string) => Promise<TranslatedResult[]>
): Promise<TranslatedResult[]> {
  const { comboChain, isComboEnabled, setPreferredModel } = useAppStore.getState();

  if (!isComboEnabled || !comboChain || comboChain.length <= 1) {
    throw error;
  }

  if (!isRateLimitError(error)) {
    throw error;
  }

  const currentIdx = comboChain.indexOf(currentModel);
  // Pick next model in chain
  const nextModel =
    currentIdx !== -1 && currentIdx + 1 < comboChain.length
      ? comboChain[currentIdx + 1]
      : currentIdx === -1 && comboChain[0] !== currentModel
      ? comboChain[0]
      : null;

  if (!nextModel || nextModel === currentModel) {
    throw new Error(
      `Semua model AI dalam rantai Combo (${comboChain.join(", ")}) telah mencapai batas kuota / rate-limit.`
    );
  }

  console.warn(`[Combo Auto-Failover] ${currentModel} reached rate limit. Auto-switching to ${nextModel}...`);
  try {
    const { toast } = await import("sonner");
    toast.warning(
      `⚠️ Kuota ${currentModel} limit! Fitur Combo otomatis beralih ke: ${nextModel}`,
      { duration: 5000 }
    );
  } catch {}

  // Update preferred model in store so subsequent batches continue with nextModel
  setPreferredModel(nextModel);

  // Retry batch with nextModel
  return retryFn(nextModel);
}

/**
 * Universal Batch PO Translation Engine
 * Dispatches to Gemini SDK or OpenAI-Compatible REST API
 */
export async function translateBatchPO(
  apiKey?: string,
  modelName?: string,
  entries: TranslateItem[] = [],
  sourceLang: string = "en_US",
  targetLang: string = "id_ID",
  glossaryTerms: GlossaryTerm[] = [],
  provider?: AiProvider,
  baseUrl?: string
): Promise<TranslatedResult[]> {
  if (entries.length === 0) return [];

  const currentProvider = provider || useAppStore.getState().aiProvider || "gemini";
  const config = getProviderConfig(currentProvider);
  const targetModel = modelName || useAppStore.getState().preferredModel || config.defaultModel;
  const targetBaseUrl = (baseUrl !== undefined ? baseUrl : (useAppStore.getState().apiBaseUrl || config.defaultBaseUrl)).replace(/\/+$/, "");
  const effectiveKey = apiKey !== undefined ? apiKey : useVaultStore.getState().getEffectiveApiKey(currentProvider);

  if (config.requiresKey && !effectiveKey) {
    throw new Error(`API Key untuk ${config.name} tidak ditemukan. Harap masukkan di pengaturan vault.`);
  }

  const glossaryInstruction =
    glossaryTerms.length > 0
      ? `\nDAFTAR GLOSARIUM WAJIB:\n` +
        glossaryTerms
          .map((g) =>
            g.dnt
              ? `- "${g.source}": JANGAN DITERJEMAHKAN (Biarkan tetap "${g.source}")`
              : `- "${g.source}" -> Diterjemahkan menjadi "${g.target}"`
          )
          .join("\n")
      : "";

  const systemInstruction = `Anda adalah mesin lokalisasi software GNU Gettext (.po) profesional dan akurat.
Tugas Anda adalah menerjemahkan teks 'msgid' dari bahasa ${sourceLang} ke bahasa target ${targetLang}.

ATURAN WAJIB (STRICT RULES):
1. WAJIB DITERJEMAHKAN KE BAHASA TARGET (${targetLang}):
   - Teks 'msgstr' HARUS benar-benar diterjemahkan ke bahasa target ${targetLang}.
   - DILARANG membiarkan teks tetap dalam bahasa sumber kecuali jika ada instruksi khusus Glosarium DNT (Do Not Translate).
2. Pertahankan SELURUH variabel placeholder printf seperti %s, %d, %1$s, %02d, %.2f, dll. persis di posisi yang semantis.
3. Pertahankan SELURUH format kurung kurawal seperti {name}, {{count}}, {0}, dll.
   - ATURAN KHUSUS HELPER PARTIKEL KOREA (|hpp / |josa): Jika teks sumber berisi helper partikel tata bahasa Korea seperti '{0}|hpp(이,가)', '{0}|hpp(에게,게)', '{0}|josa(...)', atau '{0}(이/가)':
     Bahasa Indonesia TIDAK MEMERLUKAN partikel tata bahasa Korea tersebut. Buang helper '|hpp(...)' dan CUKUP gunakan variabel intinya saja yaitu '{0}' (misal '{0} telah lulus...'). DILARANG MENULISKAN KEMBALI teks '|hpp' dan DILARANG menerjemahkan partikel Korea menjadi '(Lee, Ga)'.
4. PERLINDUNGAN KETAT TAG HTML/XML (STRICT TAG IMMUTABILITY):
   - JANGAN PERNAH mengubah, menerjemahkan, atau mengganti karakter APAPUN yang berada di dalam kurung siku tag <...>.
   - DILARANG KERAS mengubah atribut tag apa pun (seperti id, class, src, href, name, width, height, style, dll.).
   - Contoh: Jika ada teks sumber berisi '<img id="Guide_1_KR" width="540" height="1134"/>', tag tersebut HARUS TETAP persis '<img id="Guide_1_KR" width="540" height="1134"/>' tanpa mengubah "_KR" menjadi "_EN" atau lainnya!
   - Hanya teks biasa yang berada di LUAR tag yang boleh diterjemahkan.
5. Pertahankan karakter escape seperti \\n atau \\t jika ada di teks sumber.
6. PERLINDUNGAN KODE IDENTIFIER / KODE ERROR DALAM KURUNG SIKU:
   - Jika terdapat pola kurung siku dengan titik dua seperti '[오류 코드 : PURPLE]' atau '[Error Code : BLUE]':
   - Terjemahkan labelnya ke bahasa target (misal '[Kode kesalahan: PURPLE]' atau '[Kode error: BLUE]'), TETAPI KODE TEKNISNYA (seperti 'PURPLE', 'BLUE', 'AUTH_ERR') HARUS TETAP ASLI DAN DILARANG DITERJEMAHKAN KE NAMA WARNA!
7. Gunakan diksi antarmuka aplikasi (UI/UX) yang natural, konsisten, ringkas, dan jelas bagi pengguna.
8. Nilai properti 'index' pada output HARUS persis sama dengan nilai 'index' pada array input yang diberikan.
${glossaryInstruction}

Format output HARUS HANYA berupa array JSON dari objek: [{ "index": number, "msgstr": string }]. Tanpa teks pembuka atau penutup lain.`;

  const inputPayload = entries.map((e) => ({
    index: e.index,
    msgid: e.msgid,
    ...(e.context ? { context: e.context } : {}),
  }));

  // Route 1: Google Gemini Native SDK
  if (currentProvider === "gemini") {
    const ai = new GoogleGenAI({ apiKey: effectiveKey });
    try {
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: JSON.stringify(inputPayload),
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                index: { type: Type.INTEGER },
                msgstr: { type: Type.STRING },
              },
              required: ["index", "msgstr"],
            },
          },
        },
      });

      const rawJson = response.text || "[]";
      const parsedResults = parseAiResponseJson(rawJson);
      return processValidation(entries, parsedResults);
    } catch (error: unknown) {
      console.error("Gemini Translation Error:", error);
      return handleComboFailover(targetModel, error, (nextModel) =>
        translateBatchPO(
          apiKey,
          nextModel,
          entries,
          sourceLang,
          targetLang,
          glossaryTerms,
          currentProvider,
          baseUrl
        )
      );
    }
  }

  // Route 1b: Google Translate Online (Variable & Tag Masking)
  if (currentProvider === "google_translate") {
    return translateBatchGoogle(entries, sourceLang, targetLang, glossaryTerms);
  }

  // Route 2: OpenAI-Compatible /chat/completions (Ollama, OpenRouter, DeepSeek, Groq, OpenAI, Custom)
  const urlCheck = validateAndSanitizeBaseUrl(targetBaseUrl);
  if (!urlCheck.isValid) {
    throw new Error(`[Keamanan URL] ${urlCheck.error || "Endpoint Base URL tidak aman."}`);
  }

  const endpoint = `${urlCheck.sanitizedUrl}/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (effectiveKey && (currentProvider !== "ollama" || effectiveKey.trim() !== "")) {
    headers["Authorization"] = `Bearer ${effectiveKey}`;
  }

  if (currentProvider === "openrouter") {
    headers["HTTP-Referer"] = typeof window !== "undefined" ? window.location.origin : "https://penerjemah-po.local";
    headers["X-Title"] = "Penerjemah PO AI";
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: targetModel,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemInstruction },
          {
            role: "user",
            content: `Berikut adalah array entri Gettext yang harus diterjemahkan. Berikan respons HANYA berupa JSON array [{"index": number, "msgstr": string}]:\n${JSON.stringify(inputPayload)}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.error?.message || errJson?.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(`[${config.name}] ${errMsg}`);
    }

    const data = await res.json();
    const rawContent = data?.choices?.[0]?.message?.content || "[]";
    const parsedResults = parseAiResponseJson(rawContent);
    return processValidation(entries, parsedResults);
  } catch (error: unknown) {
    console.error(`AI Translation Error (${currentProvider}):`, error);
    return handleComboFailover(targetModel, error, (nextModel) =>
      translateBatchPO(
        apiKey,
        nextModel,
        entries,
        sourceLang,
        targetLang,
        glossaryTerms,
        currentProvider,
        baseUrl
      )
    );
  }
}

/**
 * Resilient JSON Parser for AI Model Responses (handles raw array, markdown fence, or wrapper object)
 */
function parseAiResponseJson(rawText: string): Array<{ index: number; msgstr: string }> {
  let cleaned = rawText.trim();

  // Strip markdown code fences if wrapped in ```json ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.translations)) return parsed.translations;
    if (parsed && Array.isArray(parsed.entries)) return parsed.entries;
    if (parsed && Array.isArray(parsed.data)) return parsed.data;
  } catch {
    // Continue to regex
  }

  // Regex fallback: find array of objects [ { ... } ]
  const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Continue
    }
  }

  // Regex fallback: find object with array property
  const objMatch = cleaned.match(/\{\s*"[a-zA-Z0-9_-]+"\s*:\s*\[[\s\S]*\]\s*\}/);
  if (objMatch) {
    try {
      const parsed = JSON.parse(objMatch[0]);
      const arr = Object.values(parsed).find((v) => Array.isArray(v));
      if (arr && Array.isArray(arr)) return arr as Array<{ index: number; msgstr: string }>;
    } catch {
      // Continue
    }
  }

  throw new Error(`Format respons JSON tidak valid dari model AI. Pratinjau output: ${rawText.slice(0, 150)}...`);
}

/**
 * Normalizes and validates placeholders (%s, {var}, <tag .../>) in translated msgstr vs source msgid.
 * Ensures output index ALWAYS maps back accurately to entry.index regardless of whether the LLM
 * returned 0-based, 1-based, or original indices.
 */
function processValidation(
  entries: TranslateItem[],
  parsedResults: Array<{ index: number; msgstr: string }>
): TranslatedResult[] {
  // Check if every entry has an exact match by index in parsedResults
  const hasExactMatches = entries.every((e) =>
    parsedResults.some((p) => p.index === e.index)
  );

  return entries.map((entry, idx) => {
    let matchedItem: { index: number; msgstr: string } | undefined;

    if (hasExactMatches) {
      matchedItem = parsedResults.find((p) => p.index === entry.index);
    } else {
      // 1. Try finding by original index
      matchedItem = parsedResults.find((p) => p.index === entry.index);
      // 2. Try finding by 0-based array position (idx)
      if (!matchedItem) {
        matchedItem = parsedResults.find((p) => p.index === idx);
      }
      // 3. Try finding by 1-based array position (idx + 1)
      if (!matchedItem) {
        matchedItem = parsedResults.find((p) => p.index === idx + 1);
      }
      // 4. Fallback to the array element at position idx
      if (!matchedItem && parsedResults[idx]) {
        matchedItem = parsedResults[idx];
      }
    }

    let finalMsgstr = matchedItem ? matchedItem.msgstr : "";

    // Auto-heal bracket error codes: if msgid has [오류 코드 : PURPLE], ensure translation preserves "PURPLE"
    const bracketCodeRegex = /\[[^\]:\n]+?\s*:\s*([A-Za-z0-9_.-]+(?:\s+[A-Za-z0-9_.-]+)*)\]/g;
    let bMatch;
    while ((bMatch = bracketCodeRegex.exec(entry.msgid)) !== null) {
      const origCode = bMatch[1].trim();
      if (/[A-Za-z0-9]/.test(origCode) && !/[가-힣ぁ-んァ-ヶ一-龥]/.test(origCode)) {
        const transBracketRegex = /\[([^\]:\n]+?)\s*:\s*([^\]\n]+)\]/g;
        finalMsgstr = finalMsgstr.replace(transBracketRegex, (m, label, transCode) => {
          if (transCode.trim().toLowerCase() !== origCode.toLowerCase()) {
            return `[${label.trim()}: ${origCode}]`;
          }
          return m;
        });
      }
    }

    const check = validatePlaceholders(entry.msgid, finalMsgstr);

    if (!check.valid) {
      const warnings = [];
      if (check.missing.length > 0) {
        warnings.push(`Variabel hilang: ${check.missing.join(", ")}`);
      }
      if (check.extra.length > 0) {
        warnings.push(`Variabel tambahan tidak dikenal: ${check.extra.join(", ")}`);
      }
      if (check.warnings && check.warnings.length > 0) {
        warnings.push(...check.warnings);
      }
      return {
        index: entry.index, // ALWAYS RETURN ORIGINAL ENTRY.INDEX
        msgstr: finalMsgstr,
        hasWarning: true,
        warningDetails: warnings.join(" | "),
      };
    }

    return {
      index: entry.index, // ALWAYS RETURN ORIGINAL ENTRY.INDEX
      msgstr: finalMsgstr,
      hasWarning: false,
    };
  });
}
