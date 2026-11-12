import { Link } from "react-router";
import {
  FileText,
  CheckCircle2,
  Cpu,
  TrendingUp,
  Upload,
  BookOpen,
  KeyRound,
  ArrowRight,
  Sparkles,
  Clock,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getProviderConfig } from "@/lib/ai-providers";
import { KpiDisplay } from "@/components/atoms/KpiDisplay";
import { ButtonApp } from "@/components/atoms/ButtonApp";
import { BadgeApp } from "@/components/atoms/BadgeApp";

interface ActivitySummaryProps {
  onOpenApiKeyModal: () => void;
  onOpenGlossaryModal?: () => void;
}

export function ActivitySummary({ onOpenApiKeyModal }: ActivitySummaryProps) {
  const { localHistories, currentPoFile, currentFileName, preferredModel, aiProvider } = useAppStore();
  const provConfig = getProviderConfig(aiProvider || "gemini");

  // 1. Total File Diproses secara Real-Time
  const uniqueHistoryFiles = new Set(localHistories.map((h) => h.file_name));
  if (currentFileName && currentPoFile) {
    uniqueHistoryFiles.add(currentFileName);
  }
  const totalFiles = uniqueHistoryFiles.size;

  // 2. Total String Selesai secara Real-Time
  const activeTranslatedCount = currentPoFile
    ? currentPoFile.entries.filter((e) => e.msgstr.trim()).length
    : 0;

  const historyTranslatedCount = localHistories.reduce(
    (sum, h) => sum + (h.translated_strings || 0),
    0
  );

  const totalStrings = historyTranslatedCount + activeTranslatedCount;

  // 3. Estimasi Token AI Real-Time berdasarkan jumlah string terjemahan dan model aktif
  // Token dihitung dari payload prompt Gettext (~24 token/entri) + respons output (~18 token/entri) = ~42 token
  const estimatedTokens = Math.round(totalStrings * 42);

  // 4. Kelengkapan Aktif Real-Time
  const activeTotalEntries = currentPoFile ? currentPoFile.entries.length : 0;
  const activePercentage =
    currentPoFile && activeTotalEntries > 0
      ? Math.round((activeTranslatedCount / activeTotalEntries) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* 4-col KPI Cards row (12-col desktop grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiDisplay
          label="Total File Diproses"
          value={totalFiles}
          sublabel={totalFiles > 0 ? `${totalFiles} proyek PO terdaftar` : "Belum ada file diproses"}
          icon={<FileText className="w-5 h-5 text-[#E95420]" />}
        />
        <KpiDisplay
          label="String Selesai"
          value={totalStrings.toLocaleString()}
          sublabel="Diterjemahkan akurat"
          icon={<CheckCircle2 className="w-5 h-5 text-[#10B981]" />}
        />
        <KpiDisplay
          label="Estimasi Token AI"
          value={`~${estimatedTokens.toLocaleString()}`}
          sublabel={`${provConfig.name.split(" ")[0]} · ${preferredModel || provConfig.defaultModel}`}
          icon={<Cpu className="w-5 h-5 text-[#A855F7]" />}
        />
        <KpiDisplay
          label="Kelengkapan Aktif"
          value={currentPoFile ? `${activePercentage}%` : "0%"}
          sublabel={
            currentPoFile
              ? `${currentFileName} (${activeTranslatedCount}/${activeTotalEntries} string)`
              : "Belum ada file aktif"
          }
          icon={<TrendingUp className="w-5 h-5 text-[#38BDF8]" />}
        />
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-[#161F30] border border-[#26334D] rounded-[12px] p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-3">
          Akses Cepat (Quick Actions)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/translator"
            className="flex items-center gap-3 p-3.5 rounded-[8px] bg-[#1C273C] border border-[#26334D] hover:border-[#E95420]/50 transition-all group"
          >
            <div className="p-2.5 rounded-[6px] bg-[#E95420]/15 text-[#E95420] group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#F8FAFC]">Unggah File .PO</div>
              <div className="text-[11px] text-[#94A3B8]">Mulai proyek baru</div>
            </div>
          </Link>

          <Link
            to="/translator"
            className="flex items-center gap-3 p-3.5 rounded-[8px] bg-[#1C273C] border border-[#26334D] hover:border-[#E95420]/50 transition-all group"
          >
            <div className="p-2.5 rounded-[6px] bg-[#10B981]/15 text-[#10B981] group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#F8FAFC]">Lanjutkan Editor</div>
              <div className="text-[11px] text-[#94A3B8]">Buka workspace aktif</div>
            </div>
          </Link>

          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className="flex items-center gap-3 p-3.5 rounded-[8px] bg-[#1C273C] border border-[#26334D] hover:border-[#E95420]/50 transition-all group text-left cursor-pointer"
          >
            <div className="p-2.5 rounded-[6px] bg-[#F59E0B]/15 text-[#F59E0B] group-hover:scale-105 transition-transform">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#F8FAFC]">Kunci API & Model</div>
              <div className="text-[11px] text-[#94A3B8]">Pengaturan PIN Pribadi</div>
            </div>
          </button>

          <Link
            to="/glossary"
            className="flex items-center gap-3 p-3.5 rounded-[8px] bg-[#1C273C] border border-[#26334D] hover:border-[#E95420]/50 transition-all group"
          >
            <div className="p-2.5 rounded-[6px] bg-[#A855F7]/15 text-[#A855F7] group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#F8FAFC]">Kelola Glosarium</div>
              <div className="text-[11px] text-[#94A3B8]">Istilah & aturan DNT</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-[#161F30] border border-[#26334D] rounded-[12px] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            Proyek & Riwayat Terakhir
          </div>
          <Link
            to="/history"
            className="text-xs text-[#E95420] hover:underline flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {localHistories.length === 0 && !currentPoFile ? (
          <div className="p-8 text-center text-xs text-[#94A3B8] border border-dashed border-[#26334D] rounded-[8px]">
            Belum ada file terjemahan yang dikerjakan. Klik <strong>Unggah File .PO</strong> untuk memulai!
          </div>
        ) : (
          <div className="space-y-2">
            {currentPoFile && (
              <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#1C273C] border border-[#E95420]/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-[#E95420]/15 text-[#E95420]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-2">
                      {currentFileName}
                      <BadgeApp intent="primary" size="xs">
                        Aktif di Editor
                      </BadgeApp>
                    </div>
                    <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                      {currentPoFile.entries.length} baris string
                    </div>
                  </div>
                </div>
                <Link to="/translator">
                  <ButtonApp intent="primary" size="sm">
                    Buka Editor
                  </ButtonApp>
                </Link>
              </div>
            )}

            {localHistories.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-[8px] bg-[#1C273C] border border-[#26334D] hover:border-[#26334D]/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-[#161F30] text-[#94A3B8]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#F8FAFC]">{item.file_name}</div>
                    <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                      {item.source_lang} → {item.target_lang} • {item.translated_strings}/{item.total_strings} string
                    </div>
                  </div>
                </div>
                <BadgeApp intent="success" size="xs">
                  Selesai
                </BadgeApp>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
