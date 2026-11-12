import { validatePlaceholders } from "./po-parser";
import type { TranslateItem, TranslatedResult, GlossaryTerm } from "./gemini";

/**
 * Maps standard gettext locale strings (e.g. "en_US", "id_ID") to Google Translate language codes.
 */
export function mapToGoogleLangCode(locale: string): string {
  if (!locale || locale === "auto") return "auto";
  const clean = locale.trim().replace(/_/g, "-");
  const lower = clean.toLowerCase();

  // Special cases
  if (lower.startsWith("zh-cn") || lower === "zh-hans") return "zh-CN";
  if (lower.startsWith("zh-tw") || lower.startsWith("zh-hk") || lower === "zh-hant") return "zh-TW";
  if (lower.startsWith("ko")) return "ko";
  if (lower.startsWith("ja")) return "ja";

  // General 2-letter fallback (e.g. "id-ID" -> "id", "en-US" -> "en")
  const primary = clean.split("-")[0].toLowerCase();
  return primary;
}

interface MaskResult {
  maskedText: string;
  tokens: Map<string, string>;
}

/**
 * Strictly masks printf format specifiers, curly brace variables, HTML/XML tags,
 * and escape sequences so Google Translate does not alter or corrupt them.
 */
export function maskGettextVariables(text: string): MaskResult {
  const tokens = new Map<string, string>();
  let tokenCounter = 0;

  // 1. Mask HTML/XML tags: <a href="...">, </span>, <img id="xyz"/>
  const tagRegex = /<\/?[a-zA-Z0-9_\-]+(?:\s+[^>]*?)?\/?>/g;
  let masked = text.replace(tagRegex, (match) => {
    const placeholder = `__TAG_${tokenCounter++}__`;
    tokens.set(placeholder, match);
    return placeholder;
  });

  // 2. Mask printf specifiers: %s, %d, %1$s, %02d, %.2f, %%
  const printfRegex = /%(\d+\$)?[#0\- +']*\d*(\.\d+)?[diouxXeEfgGaAcsb%]/g;
  masked = masked.replace(printfRegex, (match) => {
    const placeholder = `__VAR_${tokenCounter++}__`;
    tokens.set(placeholder, match);
    return placeholder;
  });

  // 3. Mask curly brace placeholders with optional Korean Josa/Postposition helper:
  // e.g. {0}, {name}, {0}|hpp(이,가), {0}|josa(은/는), {0}(이/가), {0}|hpp(을,를)
  // Automatically normalizes Korean particle helpers down to base variable {0} so Indonesian output is clean
  const curlyRegex = /\{{1,2}[a-zA-Z0-9_.-]+\}{1,2}(?:(?:\|[a-zA-Z0-9_]+)?\([^)]*\))?/g;
  masked = masked.replace(curlyRegex, (match) => {
    const baseVar = match.replace(/(?:\|[a-zA-Z0-9_]+)?\([^)]*\)$/, "");
    const placeholder = `__VAR_${tokenCounter++}__`;
    tokens.set(placeholder, baseVar);
    return placeholder;
  });

  // 4. Mask technical error codes/identifiers inside square brackets with colon:
  // e.g. [오류 코드 : PURPLE] -> preserves PURPLE as __VAR_N__, allowing "오류 코드" to translate to "Kode kesalahan"
  const bracketCodeRegex = /\[([^\]:\n]+?)\s*:\s*([A-Za-z0-9_.-]+(?:\s+[A-Z0-9_.-]+)*)\]/g;
  masked = masked.replace(bracketCodeRegex, (fullMatch, label, code) => {
    // Only mask if code contains at least one Latin alphanumeric char and NO Hangul/CJK
    if (!/[A-Za-z0-9]/.test(code) || /[가-힣ぁ-んァ-ヶ一-龥]/.test(code)) {
      return fullMatch;
    }
    const placeholder = `__VAR_${tokenCounter++}__`;
    tokens.set(placeholder, code.trim());
    return `[${label.trim()} : ${placeholder}]`;
  });

  return { maskedText: masked, tokens };
}

/**
 * Restores original printf specifiers, curly variables, and tags.
 * Tolerates any whitespace or case shifts introduced by translation engines.
 */
export function unmaskGettextVariables(translatedText: string, tokens: Map<string, string>): string {
  let unmasked = translatedText;

  for (const [placeholder, originalValue] of tokens.entries()) {
    // Extract token index, e.g. __TAG_0__ or __VAR_1__
    const isTag = placeholder.startsWith("__TAG_");
    const idMatch = placeholder.match(/\d+/);
    if (!idMatch) continue;
    const id = idMatch[0];

    // Regex tolerant to spaces: __ TAG_0 __ or __TAG_0__ or __tag_0__ or _ VAR 0 _
    const tokenType = isTag ? "TAG" : "VAR";
    const tolerantRegex = new RegExp(`_{1,2}\\s*${tokenType}\\s*[_\\s]*${id}\\s*_{1,2}`, "gi");

    unmasked = unmasked.replace(tolerantRegex, originalValue);
  }

  return unmasked;
}

/**
 * Splits extra-long text (> 1,800 chars) on sentence or newline boundaries
 * to safely stay well within standard browser GET URL limits (8,192 chars).
 */
export function splitIntoSentenceChunks(text: string, maxLen = 1500): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > maxLen) {
      if (current) chunks.push(current);
      current = s;
    } else {
      current += s;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Translates a single text using Google Translate GTX web endpoint via HTTP GET.
 * Safe against CORS preflight blocks in all browsers (CORS Simple Request).
 * Splits extra-long text into sentence chunks to prevent URL length overflow.
 * Includes automatic rate-limit (HTTP 429) detection and exponential backoff retry.
 */
export async function translateSingleWithGoogle(
  text: string,
  sourceLang: string = "en",
  targetLang: string = "id",
  retryCount: number = 0
): Promise<string> {
  if (!text || text.trim() === "") return "";

  let sl = mapToGoogleLangCode(sourceLang);
  const tl = mapToGoogleLangCode(targetLang);

  // Safety auto-override: If sourceLang is set to English/auto or doesn't match the text script,
  // detect specific scripts (Korean, Japanese, Chinese, Cyrillic, Arabic) so Google doesn't hallucinate
  if (sl === "en" || sl === "auto") {
    if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text)) {
      sl = "ko";
    } else if (/[ぁ-んァ-ヶ]/.test(text)) {
      sl = "ja";
    } else if (/[一-龥]/.test(text)) {
      sl = "zh-CN";
    } else if (/[а-яА-ЯёЁ]/.test(text)) {
      sl = "ru";
    } else if (/[؀-ۿ]/.test(text)) {
      sl = "ar";
    } else if (/[ก-๙]/.test(text)) {
      sl = "th";
    }
  }

  // If text is extra-long, chunk by sentence to avoid URL query limits
  if (text.length > 1800) {
    const chunks = splitIntoSentenceChunks(text, 1500);
    const translatedParts = await Promise.all(
      chunks.map((c) => translateSingleWithGoogle(c, sourceLang, targetLang, retryCount))
    );
    return translatedParts.join("");
  }

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
    sl
  )}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);

  if (!res.ok) {
    // If rate-limited (429), apply exponential backoff cooldown and retry
    if (res.status === 429 && retryCount < 2) {
      const waitTime = (retryCount + 1) * 2000;
      await new Promise((r) => setTimeout(r, waitTime));
      return translateSingleWithGoogle(text, sourceLang, targetLang, retryCount + 1);
    }
    throw new Error(`Google Translate Error: HTTP ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    return text;
  }

  // data[0] contains array of sentence segments: [[translated, original], ...]
  const translated = data[0]
    .map((item: unknown) => (Array.isArray(item) && typeof item[0] === "string" ? item[0] : ""))
    .join("");

  return translated;
}

/**
 * Polite, rate-limited batch translation via Google Translate with Variable Masking and Delay.
 */
export async function translateBatchGoogle(
  entries: TranslateItem[] = [],
  sourceLang: string = "en_US",
  targetLang: string = "id_ID",
  glossaryTerms: GlossaryTerm[] = []
): Promise<TranslatedResult[]> {
  if (entries.length === 0) return [];

  // Rate-limiting settings: Concurrency 2 with 250ms throttle delay between waves
  const CONCURRENCY = 2;
  const THROTTLE_DELAY_MS = 250;
  const results: TranslatedResult[] = new Array(entries.length);

  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, THROTTLE_DELAY_MS));
    }

    const chunk = entries.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (entry, chunkIdx) => {
        const itemIdx = i + chunkIdx;
        try {
          // Check for exact Do Not Translate (DNT) terms
          const dntMatch = glossaryTerms.find(
            (g) => g.dnt && g.source.trim().toLowerCase() === entry.msgid.trim().toLowerCase()
          );
          if (dntMatch) {
            results[itemIdx] = {
              index: entry.index,
              msgstr: entry.msgid,
              hasWarning: false,
            };
            return;
          }

          // 1. Mask variables and tags
          const { maskedText, tokens } = maskGettextVariables(entry.msgid);

          // 2. Fetch translation with rate-limit recovery
          const rawTranslated = await translateSingleWithGoogle(maskedText, sourceLang, targetLang);

          // 3. Unmask variables and tags
          let finalMsgstr = unmaskGettextVariables(rawTranslated, tokens);

          // 4. Apply glossary replacements if applicable
          for (const g of glossaryTerms) {
            if (!g.dnt && g.source && g.target) {
              const regex = new RegExp(`\\b${g.source}\\b`, "gi");
              finalMsgstr = finalMsgstr.replace(regex, g.target);
            }
          }

          // 4b. Auto-heal bracket error codes: if msgid has [오류 코드 : PURPLE], ensure translation preserves "PURPLE"
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

          // 5. Validate placeholders
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
            results[itemIdx] = {
              index: entry.index,
              msgstr: finalMsgstr,
              hasWarning: true,
              warningDetails: warnings.join(" | "),
            };
          } else {
            results[itemIdx] = {
              index: entry.index,
              msgstr: finalMsgstr,
              hasWarning: false,
            };
          }
        } catch (err: unknown) {
          const error = err as { message?: string };
          console.error(`Google Translate error for item index ${entry.index}:`, err);
          results[itemIdx] = {
            index: entry.index,
            msgstr: "",
            hasWarning: true,
            warningDetails: error.message || "Gagal menerjemahkan dengan Google Translate",
          };
        }
      })
    );
  }

  const successCount = results.filter((r) => r && r.msgstr && r.msgstr.trim() !== "").length;
  if (successCount === 0 && entries.length > 0) {
    const firstErr = results.find((r) => r?.warningDetails)?.warningDetails || "Koneksi ke server Google Translate gagal";
    throw new Error(`Google Translate gagal: ${firstErr}`);
  }

  return results;
}
