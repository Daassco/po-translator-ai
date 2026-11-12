import * as React from "react";
import { Link, useOutletContext } from "react-router";
import { Languages, FileUp, Lock, Cpu, Settings, RotateCcw, Globe } from "lucide-react";
import { GithubIcon } from "@/components/atoms/GithubIcon";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { PROVIDER_LIST, getProviderConfig, type AiProvider } from "@/lib/ai-providers";
import { PoDropzone } from "@/components/organisms/PoDropzone";
import { LanguageSelector } from "@/components/molecules/LanguageSelector";
import { BatchControlBar } from "@/components/organisms/BatchControlBar";
import { PoEditorTable } from "@/components/organisms/PoEditorTable";
import { ExportModal } from "@/components/organisms/ExportModal";
import { ButtonApp } from "@/components/atoms/ButtonApp";
import { toast } from "sonner";

interface ContextType {
  onOpenApiKeyModal: () => void;
  onOpenAuthModal: () => void;
}

export function TranslatorPage() {
  const { onOpenApiKeyModal, onOpenAuthModal } = useOutletContext<ContextType>();
  const { isAuthenticated } = useAuthStore();
  const {
    currentPoFile,
    sourceLang,
    targetLang,
    aiProvider,
    setAiProvider,
    preferredModel,
    setPreferredModel,
    setSourceLang,
    setTargetLang,
    clearCurrentFile,
    setCurrentFile,
    localHistories,
  } = useAppStore();

  const providerConfig = getProviderConfig(aiProvider || "gemini");
  const isCustomModel =
    preferredModel &&
    !providerConfig.models.some((m) => m.id === preferredModel);

  const [isExportOpen, setIsExportOpen] = React.useState(false);

  const latestHistory = localHistories.length > 0 ? localHistories[0] : null;

  const handleRestoreLastSession = () => {
    if (!latestHistory) return;
    setCurrentFile(
      latestHistory.file_name,
      {
        headers: latestHistory.po_header || {},
        rawHeaderComments: [],
        entries: latestHistory.po_entries.map((e) => ({
          id: e.id,
          msgid: e.msgid,
          msgstr: e.msgstr,
          msgctxt: e.msgctxt,
          comments: e.comments || [],
          flags: e.flags || [],
        })),
      },
      latestHistory.source_lang,
      latestHistory.target_lang
    );
    toast.success(`Berhasil memulihkan sesi "${latestHistory.file_name}" ke editor!`);
  };

  // Jika BELUM LOGIN: Tampilkan Auth Wall
  if (!isAuthenticated) {
    return (
      <div className="bg-[#161F30] border border-[#26334D] rounded-[16px] p-8 text-center max-w-lg mx-auto mt-12 space-y-4 shadow-xl animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-full bg-[#E95420]/15 flex items-center justify-center text-[#E95420] mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[#F8FAFC]">
            Workspace Penerjemah Terkunci
          </h2>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Demi keamanan dan integritas proyek open-source, Anda harus masuk dengan akun GitHub terlebih dahulu untuk menggunakan Workspace Editor PO dan AI Batch Engine.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <ButtonApp
            intent="primary"
            size="md"
            onClick={onOpenAuthModal}
            className="gap-2 w-full sm:w-auto"
          >
            <GithubIcon className="w-4 h-4" />
            <span>Masuk dengan GitHub</span>
          </ButtonApp>
          <Link to="/" className="w-full sm:w-auto">
            <ButtonApp intent="secondary" size="md" className="w-full">
              Buka Panduan
            </ButtonApp>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#26334D] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Languages className="w-6 h-6 text-[#E95420]" />
            <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">
              Penerjemah PO AI
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Unggah file .po, sesuaikan pasangan bahasa, dan terjemahkan otomatis menggunakan Google Gemini
          </p>
        </div>

        {currentPoFile && (
          <div className="flex items-center gap-2">
            <ButtonApp
              intent="ghost"
              size="sm"
              onClick={clearCurrentFile}
              className="text-[#94A3B8] hover:text-[#EF4444] gap-1.5"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Ganti File Lain</span>
            </ButtonApp>
          </div>
        )}
      </div>

      {/* Step 1: Upload or Active File Status */}
      {!currentPoFile ? (
        <div className="space-y-4">
          {latestHistory && (
            <div className="bg-[#161F30] border border-[#E95420]/40 rounded-[12px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#E95420]/15 rounded-[8px] text-[#E95420]">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#F8FAFC] flex flex-wrap items-center gap-2">
                    <span>Sesi Terakhir Ditemukan:</span>
                    <span className="font-mono text-[#38BDF8]">{latestHistory.file_name}</span>
                    <span className="text-[11px] bg-[#10B981]/15 text-[#10B981] px-2 py-0.5 rounded font-mono border border-[#10B981]/30">
                      {latestHistory.translated_strings} / {latestHistory.total_strings} string selesai ({Math.round((latestHistory.translated_strings / (latestHistory.total_strings || 1)) * 100)}%)
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Progres terjemahan sebelumnya tersimpan aman. Lanjutkan langsung di editor tanpa mengulang dari awal.
                  </p>
                </div>
              </div>
              <ButtonApp
                intent="primary"
                size="sm"
                onClick={handleRestoreLastSession}
                className="gap-1.5 shrink-0 w-full sm:w-auto cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Pulihkan Sesi ke Editor</span>
              </ButtonApp>
            </div>
          )}
          <PoDropzone />
        </div>
      ) : (
        <>
          {/* Step 2: Language & Model Selector Row */}
          <div className="bg-[#161F30] border border-[#26334D] rounded-[12px] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              <span>Konfigurasi Bahasa & Engine Penerjemah</span>
              <div className="flex items-center gap-2 font-mono normal-case">
                <span className="text-[#E95420] text-[11px] bg-[#E95420]/10 px-2 py-0.5 rounded border border-[#E95420]/20">
                  {providerConfig.name}
                </span>
                <span className="text-[11px] text-[#10B981]">Model: {preferredModel}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
              {/* 1. Bahasa Sumber */}
              <LanguageSelector
                label="Bahasa Sumber (Source)"
                value={sourceLang}
                onChange={setSourceLang}
              />

              {/* 2. Bahasa Target */}
              <LanguageSelector
                label="Bahasa Target (Target)"
                value={targetLang}
                onChange={setTargetLang}
              />

              {/* 3. Penyedia / Mesin Penerjemah */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#E95420]" />
                    Penyedia / Mesin
                  </label>
                  {providerConfig.requiresKey && (
                    <button
                      onClick={onOpenApiKeyModal}
                      className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer"
                      title="Atur API Key di Vault"
                    >
                      <Settings className="w-3 h-3" /> Vault
                    </button>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={aiProvider}
                    onChange={(e) => {
                      const newProv = e.target.value as AiProvider;
                      setAiProvider(newProv);
                      const cfg = getProviderConfig(newProv);
                      setPreferredModel(cfg.defaultModel);
                      if (newProv === "google_translate") {
                        toast.success("Beralih ke Google Translate (Mesin Cepat Bebas Limit)!");
                      } else {
                        toast.info(`Beralih ke penyedia ${cfg.name}`);
                      }
                    }}
                    className="w-full bg-[#1C273C] border border-[#26334D] text-[#F8FAFC] text-sm rounded-[8px] px-3 py-2.5 appearance-none focus:outline-none focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] transition-colors cursor-pointer font-sans"
                  >
                    {PROVIDER_LIST.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#161F30] text-[#F8FAFC]">
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#94A3B8]">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 4. Model Engine */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#E95420]" />
                    Model
                  </label>
                  <button
                    onClick={onOpenApiKeyModal}
                    className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer"
                    title="Pengaturan Kunci & Model"
                  >
                    <Settings className="w-3 h-3" /> Konfigurasi
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={preferredModel}
                    onChange={(e) => setPreferredModel(e.target.value)}
                    className="w-full bg-[#1C273C] border border-[#26334D] text-[#F8FAFC] text-sm rounded-[8px] px-3 py-2.5 appearance-none focus:outline-none focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] transition-colors cursor-pointer font-mono text-xs"
                  >
                    {providerConfig.models.map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#161F30] text-[#F8FAFC]">
                        {m.name} {m.tag ? `(${m.tag})` : ""}
                      </option>
                    ))}
                    {isCustomModel && (
                      <option value={preferredModel} className="bg-[#161F30] text-[#10B981]">
                        ✨ {preferredModel} (Kustom)
                      </option>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#94A3B8]">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Batch Control & Progress Bar */}
          <BatchControlBar
            onOpenApiKeyModal={onOpenApiKeyModal}
            onOpenExportModal={() => setIsExportOpen(true)}
          />

          {/* Step 4: Two-Column PO Editor Table */}
          <PoEditorTable />
        </>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
