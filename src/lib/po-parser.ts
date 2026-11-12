export interface PoEntry {
  id: number;
  msgid: string;
  msgstr: string;
  msgctxt?: string;
  msgid_plural?: string;
  msgstr_plural?: string[];
  comments: string[]; // includes '#:', '#,', '#.', '# '
  flags: string[]; // e.g. ['fuzzy', 'c-format']
  obsolete?: boolean;
}

export interface PoFile {
  headers: Record<string, string>;
  rawHeaderComments: string[];
  entries: PoEntry[];
}

// Unescape po string
function unescapePoString(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

// Escape po string for output
function escapePoString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\n/g, "\\n");
}

function formatPoField(label: string, value: string): string {
  if (value.includes("\n")) {
    const lines = value.split("\n");
    let result = `${label} ""\n`;
    for (let i = 0; i < lines.length; i++) {
      const isLast = i === lines.length - 1;
      const lineContent = lines[i] + (isLast ? "" : "\\n");
      result += `"${escapePoString(lineContent)}"\n`;
    }
    return result;
  }
  return `${label} "${escapePoString(value)}"\n`;
}

export function parsePo(content: string): PoFile {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const headers: Record<string, string> = {};
  const rawHeaderComments: string[] = [];
  const entries: PoEntry[] = [];

  let currentComments: string[] = [];
  let currentFlags: string[] = [];
  let currentContext: string | undefined = undefined;
  let currentField: "msgid" | "msgstr" | "msgctxt" | "msgid_plural" | null = null;
  let rawMsgid = "";
  let rawMsgstr = "";
  let rawMsgctxt = "";
  let rawMsgidPlural = "";
  let isHeaderParsed = false;
  let entryCount = 0;

  function commitEntry() {
    if (rawMsgid === "" && !isHeaderParsed) {
      // Header entry
      isHeaderParsed = true;
      const headerStr = unescapePoString(rawMsgstr);
      const headerLines = headerStr.split("\n");
      for (const line of headerLines) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > -1) {
          const key = line.slice(0, colonIdx).trim();
          const val = line.slice(colonIdx + 1).trim();
          headers[key] = val;
        }
      }
      rawHeaderComments.push(...currentComments);
    } else if (rawMsgid !== "") {
      entryCount++;
      entries.push({
        id: entryCount,
        msgid: unescapePoString(rawMsgid),
        msgstr: unescapePoString(rawMsgstr),
        msgctxt: currentContext ? unescapePoString(currentContext) : undefined,
        msgid_plural: rawMsgidPlural ? unescapePoString(rawMsgidPlural) : undefined,
        comments: [...currentComments],
        flags: [...currentFlags],
      });
    }

    currentComments = [];
    currentFlags = [];
    currentContext = undefined;
    currentField = null;
    rawMsgid = "";
    rawMsgstr = "";
    rawMsgctxt = "";
    rawMsgidPlural = "";
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "") {
      if (rawMsgid !== "" || (currentField && !isHeaderParsed)) {
        commitEntry();
      }
      continue;
    }

    // Comment lines
    if (line.startsWith("#")) {
      if (line.startsWith("#,")) {
        // Flags
        const flags = line
          .substring(2)
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean);
        currentFlags.push(...flags);
      }
      currentComments.push(line);
      continue;
    }

    // Context
    if (line.startsWith("msgctxt ")) {
      currentField = "msgctxt";
      const match = line.match(/^msgctxt\s+"(.*)"$/);
      rawMsgctxt = match ? match[1] : "";
      continue;
    }

    // msgid
    if (line.startsWith("msgid ")) {
      currentField = "msgid";
      const match = line.match(/^msgid\s+"(.*)"$/);
      rawMsgid = match ? match[1] : "";
      continue;
    }

    // msgid_plural
    if (line.startsWith("msgid_plural ")) {
      currentField = "msgid_plural";
      const match = line.match(/^msgid_plural\s+"(.*)"$/);
      rawMsgidPlural = match ? match[1] : "";
      continue;
    }

    // msgstr
    if (line.startsWith("msgstr ") || line.startsWith("msgstr[0] ")) {
      currentField = "msgstr";
      const match = line.match(/^msgstr(?:\[\d+\])?\s+"(.*)"$/);
      rawMsgstr = match ? match[1] : "";
      continue;
    }

    // Multiline continuation
    if (line.startsWith('"') && line.endsWith('"')) {
      const strVal = line.slice(1, -1);
      if (currentField === "msgid") {
        rawMsgid += strVal;
      } else if (currentField === "msgstr") {
        rawMsgstr += strVal;
      } else if (currentField === "msgctxt") {
        rawMsgctxt += strVal;
      } else if (currentField === "msgid_plural") {
        rawMsgidPlural += strVal;
      }
      continue;
    }
  }

  // Commit last entry if file didn't end with empty line
  if (rawMsgid !== "" || (currentField && !isHeaderParsed)) {
    commitEntry();
  }

  return {
    headers,
    rawHeaderComments,
    entries,
  };
}

export function compilePo(poFile: PoFile, targetLanguage?: string): string {
  let output = "";

  // Write header comments
  if (poFile.rawHeaderComments.length > 0) {
    output += poFile.rawHeaderComments.join("\n") + "\n";
  } else {
    output += `# Translations for GNU Gettext\n# Generated by Penerjemah PO AI\n`;
  }

  // Update header metadata
  const headers = { ...poFile.headers };
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const timezoneOffset = -now.getTimezoneOffset();
  const offsetSign = timezoneOffset >= 0 ? "+" : "-";
  const offsetHours = pad(Math.floor(Math.abs(timezoneOffset) / 60));
  const offsetMinutes = pad(Math.abs(timezoneOffset) % 60);
  const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}${offsetSign}${offsetHours}${offsetMinutes}`;

  headers["PO-Revision-Date"] = formattedDate;
  if (targetLanguage) {
    headers["Language"] = targetLanguage;
  }
  if (!headers["MIME-Version"]) headers["MIME-Version"] = "1.0";
  if (!headers["Content-Type"]) headers["Content-Type"] = "text/plain; charset=UTF-8";
  if (!headers["Content-Transfer-Encoding"]) headers["Content-Transfer-Encoding"] = "8bit";
  if (!headers["X-Generator"]) headers["X-Generator"] = "Penerjemah PO AI (Gemini 2.5 Flash)";

  let headerBody = "";
  for (const [key, value] of Object.entries(headers)) {
    headerBody += `${key}: ${value}\\n\n`;
  }

  output += `msgid ""\nmsgstr ""\n${headerBody}\n`;

  // Write each entry
  for (const entry of poFile.entries) {
    if (entry.comments.length > 0) {
      output += entry.comments.join("\n") + "\n";
    }

    if (entry.msgctxt) {
      output += formatPoField("msgctxt", entry.msgctxt);
    }

    output += formatPoField("msgid", entry.msgid);

    if (entry.msgid_plural) {
      output += formatPoField("msgid_plural", entry.msgid_plural);
      output += formatPoField("msgstr[0]", entry.msgstr);
    } else {
      output += formatPoField("msgstr", entry.msgstr);
    }

    output += "\n";
  }

  return output;
}

// Variable & Placeholder extractor for validation guard
export function extractPlaceholders(text: string): string[] {
  const matches: string[] = [];

  // Printf style: %s, %d, %1$s, %02d, %.2f, etc.
  const printfRegex = /%(?:\d+\$)?[+-]?(?:[ 0]|'.')?-?\d*(?:\.\d+)?[bcdeEfFgGosuxX]/g;
  let match;
  while ((match = printfRegex.exec(text)) !== null) {
    matches.push(match[0]);
  }

  // Curly braces & Korean postposition helpers: {name}, {{count}}, {0}, {0}|hpp(이,가), {0}(이/가)
  // Automatically normalizes Korean postposition helper down to base variable {0}
  const curlyRegex = /\{\{?[a-zA-Z0-9_.-]+\}\}?(?:(?:\|[a-zA-Z0-9_]+)?\([^)]*\))?/g;
  while ((match = curlyRegex.exec(text)) !== null) {
    const baseVar = match[0].replace(/(?:\|[a-zA-Z0-9_]+)?\([^)]*\)$/, "");
    matches.push(baseVar);
  }

  // HTML / XML tags: <b>, </b>, <a href="...">, <br/>
  const htmlRegex = /<\/?[a-zA-Z][^>]*>/g;
  while ((match = htmlRegex.exec(text)) !== null) {
    matches.push(match[0]);
  }

  // Technical identifier codes inside brackets: [오류 코드 : PURPLE] -> extracts "PURPLE"
  const bracketCodeRegex = /\[[^\]:\n]+?\s*:\s*([A-Za-z0-9_.-]+(?:\s+[A-Z0-9_.-]+)*)\]/g;
  while ((match = bracketCodeRegex.exec(text)) !== null) {
    const code = match[1].trim();
    if (/[A-Za-z0-9]/.test(code) && !/[가-힣ぁ-んァ-ヶ一-龥]/.test(code)) {
      matches.push(code);
    }
  }

  return matches;
}

export function validatePlaceholders(
  source: string,
  translation: string
): { valid: boolean; missing: string[]; extra: string[]; warnings?: string[] } {
  const sourcePlaceholders = extractPlaceholders(source);
  const translationPlaceholders = extractPlaceholders(translation);

  const missing = sourcePlaceholders.filter((p) => !translationPlaceholders.includes(p));
  const extra = translationPlaceholders.filter((p) => !sourcePlaceholders.includes(p));

  // Check for leftover broken Korean particle syntax in Indonesian translation (like |hpp or (Lee, Ga))
  const leftoverIssues: string[] = [];
  if (/\|hpp|\(Lee,\s*Ga\)|\(이,가\)|\(은,는\)|\(을,를\)|\(에게,게\)/i.test(translation)) {
    leftoverIssues.push("Sintaks partikel |hpp atau (Lee, Ga) tertinggal (perlu diperbaiki)");
  }

  return {
    valid: missing.length === 0 && extra.length === 0 && leftoverIssues.length === 0,
    missing,
    extra,
    warnings: leftoverIssues,
  };
}

/**
 * Determines whether a PO entry is genuinely translated.
 * Returns false if:
 * 1. msgstr is empty or only whitespace.
 * 2. msgstr is an exact clone of msgid (untranslated template).
 * 3. Flagged as 'fuzzy' (requires review).
 * 4. Target language is Latin-based (e.g. Indonesian id_ID) but msgstr still contains
 *    Korean, Japanese, Chinese, Cyrillic, or Arabic characters.
 */
export function isEntryTranslated(
  entry: { msgid: string; msgstr: string; flags?: string[] },
  targetLang: string = "id_ID"
): boolean {
  const str = entry.msgstr ? entry.msgstr.trim() : "";
  const id = entry.msgid ? entry.msgid.trim() : "";
  if (!str) return false;
  if (str === id) return false;
  if (entry.flags && entry.flags.includes("fuzzy")) return false;

  const targetLower = targetLang.toLowerCase();
  const isTargetLatin = ["id", "en", "es", "de", "fr", "pt", "it", "nl", "vi", "ms"].some((code) =>
    targetLower.startsWith(code)
  );

  if (isTargetLatin) {
    // If msgstr still contains Korean characters while target is Indonesian/Latin, it's not translated!
    if (/[가-힣]/.test(str)) return false;
    // Japanese Kana
    if (/[ぁ-んァ-ヶ]/.test(str)) return false;
    // Chinese Hanzi
    if (/[一-龥]/.test(str)) return false;
    // Russian Cyrillic
    if (/[а-яА-ЯёЁ]/.test(str)) return false;
    // Arabic
    if (/[؀-ۿ]/.test(str)) return false;
    // Thai
    if (/[ก-๙]/.test(str)) return false;
  }

  return true;
}

/**
 * Automatically inspects sample entries to detect the source language.
 */
export function detectSourceLanguage(entries: PoEntry[]): string {
  if (!entries || entries.length === 0) return "auto";
  const sample = entries.slice(0, 20).map((e) => e.msgid).join(" ");

  if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(sample)) return "ko_KR";
  if (/[ぁ-んァ-ヶ]/.test(sample)) return "ja_JP";
  if (/[一-龥]/.test(sample)) return "zh_CN";
  if (/[а-яА-ЯёЁ]/.test(sample)) return "ru_RU";
  if (/[؀-ۿ]/.test(sample)) return "ar_SA";
  if (/[ก-๙]/.test(sample)) return "th_TH";

  return "auto";
}
