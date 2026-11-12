import * as React from "react";
import { Search, Copy, AlertCircle, Sparkles, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useVaultStore } from "@/store/useVaultStore";
import { validatePlaceholders, extractPlaceholders, isEntryTranslated, type PoEntry } from "@/lib/po-parser";
import { translateBatchPO } from "@/lib/gemini";
import { BadgeApp } from "@/components/atoms/BadgeApp";
import { InputApp } from "@/components/atoms/InputApp";
import { toast } from "sonner";
import { checkActionCooldown } from "@/lib/rate-limiter";

export function PoEditorTable() {
  const { currentPoFile, targetLang, updateEntryMsgstr } = useAppStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterType, setFilterType] = React.useState<"all" | "untranslated" | "translated" | "fuzzy" | "warnings">("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(50);
  const [translatingRowId, setTranslatingRowId] = React.useState<number | null>(null);

  // Reset page when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, pageSize]);

  if (!currentPoFile || currentPoFile.entries.length === 0) {
    return (
      <div className="bg-[#161F30] border border-[#26334D] rounded-[12px] p-12 text-center text-[#94A3B8]">
        <p className="text-sm">Silakan unggah file .po terlebih dahulu untuk membuka tabel editor.</p>
      </div>
    );
  }

  // Handle single row on-demand translation (with Rate Limiting Protection)
  const handleTranslateSingleRow = async (entry: PoEntry) => {
    const cooldown = checkActionCooldown(`single_row_${entry.id}`, 1200);
    if (!cooldown.allowed) {
      toast.warning(`Mohon tunggu ${cooldown.waitSeconds} detik sebelum menerjemahkan ulang.`);
      return;
    }

    try {
      setTranslatingRowId(entry.id);
      const {
        aiProvider,
        sourceLang,
        targetLang,
        preferredModel,
        apiBaseUrl,
        localGlossaries,
      } = useAppStore.getState();
      const { getEffectiveApiKey } = useVaultStore.getState();
      const effectiveApiKey = getEffectiveApiKey(aiProvider);

      const activeGlossaries = localGlossaries.map((g) => ({
        source: g.source_term,
        target: g.target_term,
        dnt: g.is_do_not_translate,
      }));

      const results = await translateBatchPO(
        effectiveApiKey,
        preferredModel,
        [{ index: entry.id, msgid: entry.msgid, context: entry.msgctxt }],
        sourceLang,
        targetLang,
        activeGlossaries,
        aiProvider,
        apiBaseUrl
      );

      if (results && results.length > 0 && results[0].msgstr) {
        updateEntryMsgstr(entry.id, results[0].msgstr);
        toast.success(`Baris #${entry.id} berhasil diterjemahkan!`);
      } else {
        toast.error(`Penyedia tidak mengembalikan hasil untuk baris #${entry.id}`);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Single row translation error:", err);
      toast.error(`Gagal menerjemahkan baris #${entry.id}: ${error.message || "Kesalahan API"}`);
    } finally {
      setTranslatingRowId(null);
    }
  };

  // Filter entries
  const filteredEntries = currentPoFile.entries.filter((entry) => {
    // Search query filter
    const matchesSearch =
      searchQuery === "" ||
      entry.msgid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.msgstr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.msgctxt && entry.msgctxt.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Status filter
    if (filterType === "untranslated") return !isEntryTranslated(entry, targetLang);
    if (filterType === "translated") return isEntryTranslated(entry, targetLang);
    if (filterType === "fuzzy") return entry.flags.includes("fuzzy");
    if (filterType === "warnings") {
      if (!isEntryTranslated(entry, targetLang)) return false;
      const check = validatePlaceholders(entry.msgid, entry.msgstr);
      return !check.valid;
    }

    return true;
  });

  const totalEntries = currentPoFile.entries.length;
  const translatedCount = currentPoFile.entries.filter((e) => isEntryTranslated(e, targetLang)).length;
  const untranslatedCount = totalEntries - translatedCount;
  const fuzzyCount = currentPoFile.entries.filter((e) => e.flags.includes("fuzzy")).length;

  const warningCount = React.useMemo(() => {
    return currentPoFile.entries.filter((e) => {
      if (!isEntryTranslated(e, targetLang)) return false;
      const check = validatePlaceholders(e.msgid, e.msgstr);
      return !check.valid;
    }).length;
  }, [currentPoFile, targetLang]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const pageEntries = filteredEntries.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      {/* Controls & Search Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#161F30] border border-[#26334D] rounded-[12px] p-3.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <InputApp
            type="text"
            placeholder="Cari msgid, msgstr, atau konteks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors ${
              filterType === "all"
                ? "bg-[#E95420] text-white"
                : "bg-[#1C273C] text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            Semua ({totalEntries})
          </button>
          <button
            onClick={() => setFilterType("untranslated")}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors ${
              filterType === "untranslated"
                ? "bg-[#E95420] text-white"
                : "bg-[#1C273C] text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            Belum ({untranslatedCount})
          </button>
          <button
            onClick={() => setFilterType("translated")}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors ${
              filterType === "translated"
                ? "bg-[#E95420] text-white"
                : "bg-[#1C273C] text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            Selesai ({translatedCount})
          </button>
          {fuzzyCount > 0 && (
            <button
              onClick={() => setFilterType("fuzzy")}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === "fuzzy"
                  ? "bg-[#E95420] text-white"
                  : "bg-[#1C273C] text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              Fuzzy ({fuzzyCount})
            </button>
          )}
          <button
            onClick={() => setFilterType("warnings")}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filterType === "warnings"
                ? "bg-[#EF4444] text-white"
                : warningCount > 0
                ? "bg-[#EF4444]/15 text-[#EF4444] hover:bg-[#EF4444]/25"
                : "bg-[#1C273C] text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            {warningCount > 0 && <AlertCircle className="w-3.5 h-3.5 text-current" />}
            Peringatan ({warningCount})
          </button>
        </div>
      </div>

      {/* Editor Table */}
      <div className="bg-[#161F30] border border-[#26334D] rounded-[12px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#1C273C] border-b border-[#26334D] text-[#94A3B8] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-1/2">Teks Asli (msgid)</th>
                <th className="py-3 px-4 w-1/2">Terjemahan (msgstr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26334D]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[#94A3B8]">
                    Tidak ada string yang cocok dengan kriteria pencarian atau filter.
                  </td>
                </tr>
              ) : (
                pageEntries.map((entry) => {
                  const placeholders = extractPlaceholders(entry.msgid);
                  const isTranslated = isEntryTranslated(entry, targetLang);
                  const validation = isTranslated
                    ? validatePlaceholders(entry.msgid, entry.msgstr)
                    : { valid: true, missing: [], extra: [] };
                  const wordCount = entry.msgid ? entry.msgid.trim().split(/\s+/).filter(Boolean).length : 0;
                  const isRowTranslating = translatingRowId === entry.id;

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-[#1C273C]/50 transition-colors ${
                        !validation.valid ? "bg-[#EF4444]/5" : ""
                      }`}
                    >
                      {/* Column 1: Index & Status */}
                      <td className="py-4 px-4 align-top text-center text-[#94A3B8] font-mono text-[11px]">
                        <div>{entry.id}</div>
                        {isTranslated ? (
                          <div className="mt-1 flex justify-center">
                            <span className="w-2 h-2 rounded-full bg-[#10B981]" title="Diterjemahkan" />
                          </div>
                        ) : (
                          <div className="mt-1 flex justify-center">
                            <span className="w-2 h-2 rounded-full bg-[#94A3B8]/40" title="Belum diterjemahkan" />
                          </div>
                        )}
                      </td>

                      {/* Column 2: Source (msgid) */}
                      <td className="py-4 px-4 align-top space-y-2">
                        {/* Context & Comments & Word Count badge */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {entry.msgctxt && (
                              <BadgeApp intent="info" size="xs">
                                ctxt: {entry.msgctxt}
                              </BadgeApp>
                            )}
                            {entry.flags.map((flag) => (
                              <BadgeApp key={flag} intent="warning" size="xs">
                                {flag}
                              </BadgeApp>
                            ))}
                            {entry.comments
                              .filter((c) => c.startsWith("#:"))
                              .slice(0, 1)
                              .map((c, idx) => (
                                <span key={idx} className="text-[10px] text-[#94A3B8] font-mono">
                                  {c.replace("#:", "loc:")}
                                </span>
                              ))}
                          </div>
                          <span className="text-[10px] text-[#94A3B8]/60 font-mono">
                            {wordCount} kata ({entry.msgid.length} kar)
                          </span>
                        </div>

                        {/* msgid text with mono styling */}
                        <div className="font-mono text-xs text-[#F8FAFC] leading-relaxed whitespace-pre-wrap break-words bg-[#0D131F] p-3 rounded-[6px] border border-[#26334D]/70">
                          {entry.msgid}
                        </div>

                        {/* Highlighted Placeholders */}
                        {placeholders.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#94A3B8]">
                            <span className="text-[10px] uppercase font-semibold text-[#94A3B8]/70">Variabel:</span>
                            {placeholders.map((p, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded-[4px] bg-[#E95420]/15 text-[#E95420] font-mono text-[11px] border border-[#E95420]/30"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Row Action Buttons: Copy & Single Translate */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              updateEntryMsgstr(entry.id, entry.msgid);
                              toast.success(`Teks asli disalin ke baris #${entry.id}`);
                            }}
                            className="text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> Salin teks asli
                          </button>

                          <button
                            type="button"
                            disabled={isRowTranslating}
                            onClick={() => handleTranslateSingleRow(entry)}
                            className="text-[11px] text-[#38BDF8] hover:text-[#7DD3FC] flex items-center gap-1.5 transition-colors font-medium cursor-pointer disabled:opacity-50"
                            title="Terjemahkan hanya baris ini dengan mesin aktif"
                          >
                            {isRowTranslating ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-[#38BDF8]" />
                                <span>Menerjemahkan baris #{entry.id}...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-[#E95420]" />
                                <span>Terjemahkan baris ini</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Column 3: Translation (msgstr) */}
                      <td className="py-4 px-4 align-top space-y-2">
                        <textarea
                          rows={Math.max(2, entry.msgid.split("\n").length)}
                          value={entry.msgstr}
                          placeholder="Ketik terjemahan di sini atau gunakan AI Batch..."
                          onChange={(e) => updateEntryMsgstr(entry.id, e.target.value)}
                          className={`w-full bg-[#1C273C] text-[#F8FAFC] font-mono text-xs p-3 rounded-[6px] border transition-colors focus:outline-none focus:ring-1 resize-y leading-relaxed ${
                            !validation.valid
                              ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]"
                              : "border-[#26334D] focus:border-[#E95420] focus:ring-[#E95420]"
                          }`}
                        />

                        {/* Variable Integrity Warning */}
                        {!validation.valid && (
                          <div className="p-2 rounded-[6px] bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-[11px] flex items-start gap-1.5 animate-in fade-in">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <div>
                              {validation.missing.length > 0 && (
                                <div>Variabel hilang: <strong className="font-mono">{validation.missing.join(", ")}</strong></div>
                              )}
                              {validation.extra.length > 0 && (
                                <div>Variabel asing: <strong className="font-mono">{validation.extra.join(", ")}</strong></div>
                              )}
                              {validation.warnings && validation.warnings.length > 0 && (
                                <div><strong className="font-mono">{validation.warnings.join(", ")}</strong></div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredEntries.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#1C273C] border-t border-[#26334D] text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <span>
                Menampilkan <strong className="text-[#F8FAFC]">{startIndex + 1}</strong> -{" "}
                <strong className="text-[#F8FAFC]">
                  {Math.min(startIndex + pageSize, filteredEntries.length)}
                </strong>{" "}
                dari <strong className="text-[#F8FAFC]">{filteredEntries.length.toLocaleString()}</strong> string
              </span>
              <span className="text-[#26334D]">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]">Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-[#161F30] border border-[#26334D] text-[#F8FAFC] rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px]">
                Halaman <strong className="text-[#F8FAFC]">{validCurrentPage}</strong> dari{" "}
                <strong className="text-[#F8FAFC]">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded bg-[#161F30] border border-[#26334D] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded bg-[#161F30] border border-[#26334D] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
