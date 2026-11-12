import * as React from "react";
import {
  Sparkles,
  Play,
  Pause,
  Square,
  Loader2,
  Download,
  AlertCircle,
  Save,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useVaultStore } from "@/store/useVaultStore";
import { translateBatchPO } from "@/lib/gemini";
import { getProviderConfig } from "@/lib/ai-providers";
import { isEntryTranslated, validatePlaceholders } from "@/lib/po-parser";
import { ButtonApp } from "@/components/atoms/ButtonApp";
import { playCompletionChime } from "@/lib/utils";
import { toast } from "sonner";
import { checkActionCooldown, checkProviderRpmLimit } from "@/lib/rate-limiter";

interface BatchControlBarProps {
  onOpenApiKeyModal: () => void;
  onOpenExportModal: () => void;
}

export function BatchControlBar({
  onOpenApiKeyModal,
  onOpenExportModal,
}: BatchControlBarProps) {
  const {
    currentPoFile,
    sourceLang,
    targetLang,
    aiProvider,
    apiBaseUrl,
    preferredModel,
    localGlossaries,
    batchUpdateMsgstr,
    batchProgress,
    setBatchProgress,
    resetBatchProgress,
    saveSessionSnapshot,
  } = useAppStore();

  const isCancelledRef = React.useRef(false);
  const isPausedRef = React.useRef(false);

  // Translation scope: default ke "all" ("Semua / Timpa") agar berkas prefill (Korea -> Inggris -> Indo) langsung mencakup seluruh baris
  const [translateMode, setTranslateMode] = React.useState<"untranslated" | "all" | "warnings">("all");

  // Batas baris per sesi: "all" atau angka tertentu (15, 30, 50, 100, 200, 500)
  // Default ke 500 baris agar aman, terukur, dan tidak membebani browser
  const [sessionLimit, setSessionLimit] = React.useState<number | "all">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("potrans_session_limit");
      if (saved === "all") return "all";
      if (saved && !isNaN(Number(saved))) return Number(saved);
    }
    return 500;
  });

  // Sync ref with state
  React.useEffect(() => {
    isPausedRef.current = batchProgress.isPaused;
  }, [batchProgress.isPaused]);

  if (!currentPoFile || currentPoFile.entries.length === 0) return null;

  const totalEntries = currentPoFile.entries.length;
  const untranslatedEntries = currentPoFile.entries.filter((e) => !isEntryTranslated(e, targetLang));
  const translatedCount = currentPoFile.entries.filter((e) => isEntryTranslated(e, targetLang)).length;
  const overallPercentage = Math.round((translatedCount / totalEntries) * 100);

  // Baris yang memiliki peringatan variabel/tag rusak
  const warningEntries = React.useMemo(() => {
    return currentPoFile.entries.filter((e) => {
      if (!isEntryTranslated(e, targetLang)) return false;
      const check = validatePlaceholders(e.msgid, e.msgstr);
      return !check.valid;
    });
  }, [currentPoFile, targetLang]);

  // Nomor baris awal manual (default mengikuti baris setelah baris tertinggi yang sudah selesai atau 1)
  const [startRow, setStartRow] = React.useState<number>(1);

  // Toggle Aktif / Nonaktif untuk batas Mulai Baris
  const [isStartRowEnabled, setIsStartRowEnabled] = React.useState<boolean>(true);

  // Jika mode Peringatan Variabel aktif, otomatis nonaktifkan filter startRow agar tidak ada baris yang terskip
  React.useEffect(() => {
    if (translateMode === "warnings") {
      setIsStartRowEnabled(false);
    }
  }, [translateMode]);

  // Deteksi baris tertinggi yang sudah diterjemahkan ke bahasa target
  const highestTranslatedRow = React.useMemo(() => {
    return currentPoFile.entries.reduce(
      (max, e) => (isEntryTranslated(e, targetLang) ? Math.max(max, e.id) : max),
      0
    );
  }, [currentPoFile, targetLang]);

  // Inisialisasi startRow pertama kali mengikuti progress baris yang sudah ada
  React.useEffect(() => {
    if (highestTranslatedRow > 0 && startRow === 1) {
      setStartRow(Math.min(totalEntries, highestTranslatedRow + 1));
    }
  }, [highestTranslatedRow, totalEntries]);

  // Tentukan mode efektif
  const effectiveMode =
    translateMode === "warnings" && warningEntries.length > 0
      ? "warnings"
      : untranslatedEntries.length === 0 && translateMode !== "warnings"
      ? "all"
      : translateMode;

  const baseEntries = React.useMemo(() => {
    if (effectiveMode === "warnings") return warningEntries;
    if (effectiveMode === "all") return currentPoFile.entries;
    return untranslatedEntries;
  }, [effectiveMode, warningEntries, currentPoFile.entries, untranslatedEntries]);

  // Filter entri: jika startRow aktif gunakan e.id >= startRow, jika nonaktif ambil seluruhnya dari item awal
  const targetEntries = React.useMemo(() => {
    if (isStartRowEnabled) {
      return baseEntries.filter((e) => e.id >= startRow);
    }
    return baseEntries;
  }, [baseEntries, isStartRowEnabled, startRow]);

  // Irisan entri sesuai batas sesi yang dipilih pengguna
  const slicedEntries = React.useMemo(() => {
    if (sessionLimit === "all") return targetEntries;
    return targetEntries.slice(0, Number(sessionLimit));
  }, [targetEntries, sessionLimit]);

  // Helper hitung jumlah kata
  const countWords = (text: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Jumlah kata & karakter untuk target sesi aktif
  const targetWords = React.useMemo(() => {
    return slicedEntries.reduce((sum, e) => sum + countWords(e.msgid), 0);
  }, [slicedEntries]);

  const targetChars = React.useMemo(() => {
    return slicedEntries.reduce((sum, e) => sum + (e.msgid?.length || 0), 0);
  }, [slicedEntries]);

  // Total kata seluruh berkas PO
  const entireFileWords = React.useMemo(() => {
    return currentPoFile.entries.reduce((sum, e) => sum + countWords(e.msgid), 0);
  }, [currentPoFile]);

  // Active batch progress calculation (0% to 100% while translating)
  const activeBatchPercent =
    batchProgress.totalCount > 0
      ? Math.round((batchProgress.translatedCount / batchProgress.totalCount) * 100)
      : 0;

  const startBatchTranslation = async () => {
    // Prevent rapid click spam
    const cooldown = checkActionCooldown("batch_start", 1000);
    if (!cooldown.allowed) return;

    const { getEffectiveApiKey } = useVaultStore.getState();
    const provConfig = getProviderConfig(aiProvider || "gemini");
    const effectiveApiKey = getEffectiveApiKey(aiProvider);

    if (provConfig.requiresKey && !effectiveApiKey) {
      toast.error(`Harap atur API Key untuk ${provConfig.name} di pengaturan model.`);
      onOpenApiKeyModal();
      return;
    }

    if (slicedEntries.length === 0) {
      toast.info("Tidak ada baris string yang perlu diterjemahkan.");
      return;
    }

    isCancelledRef.current = false;
    isPausedRef.current = false;

    // Batching per 15 items for optimal responsiveness and speed
    const BATCH_SIZE = 15;
    const itemsToProcess = slicedEntries.map((e) => ({
      index: e.id,
      msgid: e.msgid,
      context: e.msgctxt,
    }));

    const totalBatches = Math.ceil(itemsToProcess.length / BATCH_SIZE);

    setBatchProgress({
      isTranslating: true,
      isPaused: false,
      currentBatch: 0,
      totalBatches,
      translatedCount: 0,
      totalCount: itemsToProcess.length,
      errorLog: [],
    });

    const activeGlossaries = localGlossaries.map((g) => ({
      source: g.source_term,
      target: g.target_term,
      dnt: g.is_do_not_translate,
    }));

    toast.info(
      `Memulai terjemahan (${provConfig.name}) untuk ${itemsToProcess.length} baris string (${targetWords.toLocaleString()} kata)...`
    );

    let processedCount = 0;

    for (let i = 0; i < totalBatches; i++) {
      if (isCancelledRef.current) {
        saveSessionSnapshot("processing");
        toast.warning("Penerjemahan dihentikan oleh pengguna. Progres tersimpan.");
        break;
      }

      // Check pause
      while (isPausedRef.current) {
        if (isCancelledRef.current) {
          saveSessionSnapshot("processing");
          break;
        }
        await new Promise((r) => setTimeout(r, 400));
      }

      if (isCancelledRef.current) {
        saveSessionSnapshot("processing");
        break;
      }

      const batchItems = itemsToProcess.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      setBatchProgress({ currentBatch: i + 1 });

      // Enforce safe RPM threshold to prevent HTTP 429 quota exhaustion
      const rpmCheck = checkProviderRpmLimit(aiProvider || "gemini");
      if (!rpmCheck.allowed && rpmCheck.waitSeconds > 0) {
        await new Promise((r) => setTimeout(r, rpmCheck.waitSeconds * 1000));
      }

      try {
        const results = await translateBatchPO(
          effectiveApiKey,
          preferredModel || provConfig.defaultModel,
          batchItems,
          sourceLang,
          targetLang,
          activeGlossaries,
          aiProvider,
          apiBaseUrl
        );

        // Update entries in store (results now guaranteed to map to entry.id)
        const updates = results
          .filter((r) => r.msgstr.trim() !== "")
          .map((r) => ({ id: r.index, msgstr: r.msgstr }));

        if (updates.length === 0) {
          throw new Error("Penyedia tidak mengembalikan hasil terjemahan pada batch ini.");
        }

        batchUpdateMsgstr(updates);
        // Simpan checkpoint setiap batch selesai agar tidak hilang jika terputus/reload
        saveSessionSnapshot("processing");

        processedCount += updates.length;
        setBatchProgress({ translatedCount: processedCount });

        // Jeda / Pacing antar batch:
        // Google Translate diberi jeda 750ms untuk mencegah pemblokiran IP 429
        const cooldownMs = aiProvider === "google_translate" ? 750 : 300;
        await new Promise((r) => setTimeout(r, cooldownMs));
      } catch (err: unknown) {
        const error = err as { message?: string };
        console.error("Batch error:", err);
        const errMsg = error.message || "Kesalahan API";
        
        // Simpan progres yang sudah berhasil sebelum error
        saveSessionSnapshot("failed");

        setBatchProgress({
          errorLog: [
            ...useAppStore.getState().batchProgress.errorLog,
            `Batch ${i + 1}/${totalBatches}: ${errMsg}`,
          ],
        });
        toast.error(`Batch ${i + 1} gagal: ${errMsg}`);
        // Jeda 2.5 detik jika terjadi error sebelum mencoba batch berikutnya
        await new Promise((r) => setTimeout(r, 2500));
      }
    }

    setBatchProgress({ isTranslating: false });

    // Finalisasi penyimpanan sesi, audio chime notifikasi, & auto-advance baris
    if (processedCount > 0) {
      saveSessionSnapshot("completed");
      if (!isCancelledRef.current) {
        playCompletionChime(); // Audio chime notifikasi sesi 200/500 selesai!
      }
      toast.success(`Selesai menerjemahkan ${processedCount} baris string! Sesi berhasil disimpan.`);

      // Otomatis majukan posisi baris berikutnya secara presisi mengikuti item terakhir yang sukses
      if (isStartRowEnabled) {
        const lastProcessed = itemsToProcess[processedCount - 1];
        if (lastProcessed) {
          const nextStart = Math.min(totalEntries, lastProcessed.index + 1);
          setStartRow(nextStart);
        }
      }
    }
  };

  const handlePauseResume = () => {
    const nextState = !batchProgress.isPaused;
    isPausedRef.current = nextState;
    setBatchProgress({ isPaused: nextState });
    toast.info(nextState ? "Penerjemahan dijeda." : "Melanjutkan penerjemahan...");
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    setBatchProgress({ isTranslating: false, isPaused: false });
    resetBatchProgress();
  };

  return (
    <div className="bg-[#161F30] border border-[#26334D] rounded-[12px] p-4 shadow-md space-y-3">
      {/* Top summary row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[#E95420]/15 flex items-center justify-center text-[#E95420] shrink-0">
            {batchProgress.isTranslating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-[#F8FAFC]">
                {batchProgress.isTranslating
                  ? `Menerjemahkan Batch ${batchProgress.currentBatch}/${batchProgress.totalBatches}...`
                  : "AI Batch Translation Engine"}
              </h4>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C273C] text-[#38BDF8] border border-[#26334D] font-mono">
                {preferredModel}
              </span>
              {aiProvider === "google_translate" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-mono" title="Jeda throttling aktif untuk menjaga keamanan IP">
                  Jeda 750ms
                </span>
              )}
            </div>
            <div className="text-xs text-[#94A3B8] flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 font-mono">
              {batchProgress.isTranslating ? (
                <span className="text-[#10B981] font-semibold">
                  Progres Berjalan: {batchProgress.translatedCount} / {batchProgress.totalCount} baris ({activeBatchPercent}%)
                </span>
              ) : (
                <span>
                  {translatedCount} / {totalEntries} string selesai ({overallPercentage}%)
                </span>
              )}
              <span>•</span>
              <span className="text-[#38BDF8]">
                File: {entireFileWords.toLocaleString()} kata
              </span>
              <span>•</span>
              <span
                className={`px-2 py-0.5 rounded border ${
                  effectiveMode === "warnings"
                    ? "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25"
                    : "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25"
                }`}
              >
                Target Sesi: {slicedEntries.length} baris
                {slicedEntries.length > 0 &&
                  (isStartRowEnabled
                    ? ` (Baris #${slicedEntries[0].id} - #${slicedEntries[slicedEntries.length - 1].id})`
                    : ` (Daftar Filter: #${slicedEntries[0].id} ... #${slicedEntries[slicedEntries.length - 1].id})`)}
                {" • "}{targetWords.toLocaleString()} kata ({targetChars.toLocaleString()} kar)
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Scope Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {!batchProgress.isTranslating ? (
            <>
              {/* Scope Switcher: Belum Diterjemahkan vs Semua String vs Peringatan */}
              <div className="flex items-center bg-[#1C273C] p-0.5 rounded-[8px] border border-[#26334D] text-xs">
                <button
                  type="button"
                  onClick={() => setTranslateMode("untranslated")}
                  disabled={untranslatedEntries.length === 0}
                  className={`px-2.5 py-1 rounded-[6px] transition-all cursor-pointer ${
                    effectiveMode === "untranslated"
                      ? "bg-[#E95420] text-white font-medium shadow-sm"
                      : "text-[#94A3B8] hover:text-[#F8FAFC]"
                  } ${untranslatedEntries.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  title="Hanya terjemahkan baris yang masih kosong atau belum diterjemahkan ke bahasa target"
                >
                  Belum Diterjemahkan ({untranslatedEntries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTranslateMode("all")}
                  className={`px-2.5 py-1 rounded-[6px] transition-all cursor-pointer ${
                    effectiveMode === "all"
                      ? "bg-[#E95420] text-white font-medium shadow-sm"
                      : "text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                  title="Terjemahkan seluruh baris dan timpa terjemahan lama ke bahasa target"
                >
                  Semua / Timpa ({totalEntries})
                </button>
                {warningEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTranslateMode("warnings");
                      setIsStartRowEnabled(false);
                    }}
                    className={`px-2.5 py-1 rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 ${
                      effectiveMode === "warnings"
                        ? "bg-[#EF4444] text-white font-medium shadow-sm"
                        : "text-[#EF4444] hover:bg-[#EF4444]/15"
                    }`}
                    title="Perbaiki baris-baris yang memiliki variabel/tag yang hilang atau rusak"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Peringatan ({warningEntries.length})</span>
                  </button>
                )}
              </div>

              {/* Mulai Baris (Manual & Presisi) dengan Toggle ON/OFF */}
              <div
                className={`flex items-center gap-1.5 bg-[#1C273C] px-2.5 py-1 rounded-[8px] border transition-all text-xs ${
                  isStartRowEnabled ? "border-[#26334D]" : "border-[#26334D]/60 opacity-85"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsStartRowEnabled(!isStartRowEnabled)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight transition-all cursor-pointer flex items-center gap-1 ${
                    isStartRowEnabled
                      ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 hover:bg-[#10B981]/30"
                      : "bg-[#94A3B8]/15 text-[#94A3B8] border border-[#94A3B8]/30 hover:text-[#F8FAFC]"
                  }`}
                  title={
                    isStartRowEnabled
                      ? "Filter Baris AKTIF: Memproses hanya mulai baris yang ditentukan. Klik untuk Nonaktifkan (proses seluruh daftar tanpa skip)"
                      : "Filter Baris NONAKTIF: Memproses seluruh item dari baris pertama. Klik untuk Aktifkan"
                  }
                >
                  {isStartRowEnabled ? "✓ Baris ON" : "✗ Baris OFF"}
                </button>

                <div
                  className={`flex items-center gap-1 transition-opacity ${
                    !isStartRowEnabled ? "opacity-40 pointer-events-none" : ""
                  }`}
                >
                  <span className="text-[#94A3B8] text-[11px] whitespace-nowrap">Mulai:</span>
                  <span className="text-[#E95420] font-mono font-bold text-xs">#</span>
                  <input
                    type="number"
                    min={1}
                    max={totalEntries}
                    disabled={!isStartRowEnabled}
                    value={startRow}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(totalEntries, Number(e.target.value) || 1));
                      setStartRow(val);
                    }}
                    className="w-16 bg-[#161F30] border border-[#26334D] text-[#F8FAFC] rounded px-1.5 py-0.5 text-xs font-mono font-semibold text-center focus:outline-none focus:border-[#E95420]"
                    title="Ketik nomor baris awal yang ingin diterjemahkan"
                  />
                  {startRow > 1 && (
                    <button
                      type="button"
                      onClick={() => setStartRow(1)}
                      className="text-[10px] text-[#94A3B8] hover:text-[#38BDF8] underline transition-colors cursor-pointer ml-0.5"
                      title="Kembali ke Baris #1"
                    >
                      Reset #1
                    </button>
                  )}
                </div>
              </div>

              {/* Batas Baris Sesi Selector & Preset Buttons */}
              <div className="flex items-center gap-1.5 bg-[#1C273C] px-2.5 py-1 rounded-[8px] border border-[#26334D] text-xs">
                <span className="text-[#94A3B8] text-[11px] whitespace-nowrap">Batas:</span>

                {/* Tombol Preset Cepat 200 & 500 */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSessionLimit(200);
                      if (effectiveMode === "untranslated" && untranslatedEntries.length < 200) {
                        setTranslateMode("all");
                        toast.info("Otomatis beralih ke tab 'Semua / Timpa' agar target 200 baris terpenuhi.");
                      }
                      try { localStorage.setItem("potrans_session_limit", "200"); } catch {}
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                      sessionLimit === 200
                        ? "bg-[#E95420] text-white shadow-sm ring-1 ring-[#E95420]"
                        : "bg-[#161F30] text-[#94A3B8] border border-[#26334D] hover:text-[#F8FAFC]"
                    }`}
                    title="Pilih langsung batas 200 baris"
                  >
                    200
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSessionLimit(500);
                      if (effectiveMode === "untranslated" && untranslatedEntries.length < 500) {
                        setTranslateMode("all");
                        toast.info("Otomatis beralih ke tab 'Semua / Timpa' agar target 500 baris terpenuhi.");
                      }
                      try { localStorage.setItem("potrans_session_limit", "500"); } catch {}
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                      sessionLimit === 500
                        ? "bg-[#E95420] text-white shadow-sm ring-1 ring-[#E95420]"
                        : "bg-[#161F30] text-[#94A3B8] border border-[#26334D] hover:text-[#F8FAFC]"
                    }`}
                    title="Pilih langsung batas 500 baris"
                  >
                    500
                  </button>
                </div>

                <select
                  value={String(sessionLimit)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsed = raw === "all" ? "all" : Number(raw);
                    setSessionLimit(parsed);
                    if (parsed !== "all" && effectiveMode === "untranslated" && untranslatedEntries.length < parsed) {
                      setTranslateMode("all");
                      toast.info(`Otomatis beralih ke tab 'Semua / Timpa' agar target ${parsed} baris terpenuhi.`);
                    }
                    try {
                      localStorage.setItem("potrans_session_limit", String(parsed));
                    } catch {}
                  }}
                  className="bg-[#161F30] border border-[#26334D] text-[#F8FAFC] rounded-[4px] px-2 py-0.5 text-xs font-mono focus:outline-none focus:border-[#E95420] cursor-pointer"
                  title="Pilihan batas baris lainnya"
                >
                  <option value="500">500 Baris</option>
                  <option value="200">200 Baris</option>
                  <option value="100">100 Baris</option>
                  <option value="50">50 Baris</option>
                  <option value="30">30 Baris</option>
                  <option value="15">15 Baris</option>
                  <option value="all">Semua ({targetEntries.length} baris)</option>
                </select>
              </div>

              <ButtonApp
                intent={effectiveMode === "warnings" ? "destructive" : "primary"}
                size="md"
                onClick={startBatchTranslation}
                disabled={slicedEntries.length === 0}
                className="gap-2 shadow-md cursor-pointer"
              >
                {effectiveMode === "warnings" ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {effectiveMode === "warnings"
                    ? `Perbaiki Peringatan (${slicedEntries.length} Baris • ${targetWords.toLocaleString()} Kata)`
                    : sessionLimit !== "all" && targetEntries.length < Number(sessionLimit)
                    ? `Terjemahkan (${slicedEntries.length} dari ${sessionLimit} Tersedia • ${targetWords.toLocaleString()} Kata)`
                    : sessionLimit === "all"
                    ? `Terjemahkan Semua (${slicedEntries.length} Baris • ${targetWords.toLocaleString()} Kata)`
                    : `Terjemahkan (${slicedEntries.length} Baris • ${targetWords.toLocaleString()} Kata)`}
                </span>
              </ButtonApp>

              <ButtonApp
                intent="secondary"
                size="md"
                onClick={onOpenExportModal}
                className="gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#E95420]" />
                <span>Unduh .PO</span>
              </ButtonApp>

              <ButtonApp
                intent="ghost"
                size="md"
                onClick={() => {
                  saveSessionSnapshot("completed");
                  toast.success("Sesi berhasil diamankan ke Riwayat & Cloud!");
                }}
                className="gap-1.5 text-[#38BDF8] hover:text-[#38BDF8] border border-[#38BDF8]/30 hover:bg-[#38BDF8]/10 cursor-pointer"
                title="Simpan cadangan sesi saat ini ke penyimpanan lokal dan Supabase"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Sesi</span>
              </ButtonApp>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <ButtonApp
                intent="secondary"
                size="sm"
                onClick={handlePauseResume}
                className="gap-1.5"
              >
                {batchProgress.isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-[#10B981]" /> Lanjutkan
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-[#F59E0B]" /> Jeda
                  </>
                )}
              </ButtonApp>

              <ButtonApp
                intent="destructive"
                size="sm"
                onClick={handleCancel}
                className="gap-1.5"
              >
                <Square className="w-3.5 h-3.5" /> Berhenti
              </ButtonApp>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Progress Bar */}
      <div className="w-full bg-[#1C273C] h-2.5 rounded-full overflow-hidden border border-[#26334D]">
        <div
          className="bg-gradient-to-r from-[#E95420] to-[#F59E0B] h-full transition-all duration-300 rounded-full"
          style={{
            width: `${batchProgress.isTranslating ? activeBatchPercent : overallPercentage}%`,
          }}
        />
      </div>

      {/* Active Batch Indicators */}
      {batchProgress.isTranslating && (
        <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E95420]" />
            <span>
              Sedang memproses Batch {batchProgress.currentBatch} dari {batchProgress.totalBatches}
            </span>
          </div>
          <div className="text-[#10B981] font-semibold">
            {batchProgress.translatedCount} / {batchProgress.totalCount} baris selesai ({activeBatchPercent}%)
          </div>
        </div>
      )}

      {/* Error Logs Feedback */}
      {batchProgress.errorLog.length > 0 && !batchProgress.isTranslating && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-[8px] p-3 text-xs text-[#EF4444] space-y-1 animate-in fade-in">
          <div className="font-semibold flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>Ditemukan kendala pada batch sebelumnya:</span>
            </div>
            <button
              onClick={() => setBatchProgress({ errorLog: [] })}
              className="text-[11px] underline hover:text-white cursor-pointer"
            >
              Tutup Peringatan
            </button>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#F8FAFC]/90 font-mono">
            {batchProgress.errorLog.map((err, i) => (
              <li key={i} className="truncate">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
