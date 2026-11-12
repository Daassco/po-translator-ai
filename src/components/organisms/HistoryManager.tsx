import * as React from "react";
import { useNavigate } from "react-router";
import { History, Search, ArrowUpRight, Trash2, Download, Calendar, FileText } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ButtonApp } from "@/components/atoms/ButtonApp";
import { InputApp } from "@/components/atoms/InputApp";
import { BadgeApp } from "@/components/atoms/BadgeApp";
import { toast } from "sonner";
import type { TranslationHistory } from "@/lib/supabase";

export function HistoryManager() {
  const navigate = useNavigate();
  const { localHistories, addLocalHistory, deleteLocalHistory, clearLocalHistories, setCurrentFile } = useAppStore();
  const { user } = useAuthStore();
  const [search, setSearch] = React.useState("");

  // Ambil riwayat dari Supabase database jika pengguna login
  React.useEffect(() => {
    if (isSupabaseConfigured && user) {
      supabase
        .from("translation_histories")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            data.forEach((item) => {
              addLocalHistory(item as TranslationHistory);
            });
          }
        });
    }
  }, [user, addLocalHistory]);

  const filtered = localHistories.filter((h) => {
    return (
      search === "" ||
      h.file_name.toLowerCase().includes(search.toLowerCase()) ||
      h.source_lang.toLowerCase().includes(search.toLowerCase()) ||
      h.target_lang.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleOpenInEditor = (item: TranslationHistory) => {
    setCurrentFile(
      item.file_name,
      {
        headers: item.po_header || {},
        rawHeaderComments: [],
        entries: item.po_entries.map((e) => ({
          id: e.id,
          msgid: e.msgid,
          msgstr: e.msgstr,
          msgctxt: e.msgctxt,
          comments: e.comments || [],
          flags: e.flags || [],
        })),
      },
      item.source_lang,
      item.target_lang
    );
    toast.success(`Memuat sesi "${item.file_name}" ke dalam Editor.`);
    navigate("/translator");
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(localHistories, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translation-history-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Cadangan riwayat berhasil diekspor ke format JSON!");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161F30] border border-[#26334D] rounded-[12px] p-5">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#E95420]" />
            <h2 className="text-base font-bold text-[#F8FAFC]">Riwayat Sesi Terjemahan</h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Buka kembali hasil terjemahan terdahulu tanpa mengonsumsi kuota token Gemini API
          </p>
        </div>

        <div className="flex items-center gap-2">
          {localHistories.length > 0 && (
            <>
              <ButtonApp
                intent="secondary"
                size="sm"
                onClick={handleExportBackup}
                className="gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>Ekspor Cadangan (JSON)</span>
              </ButtonApp>

              <ButtonApp
                intent="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Apakah Anda yakin ingin mengosongkan seluruh riwayat terjemahan?")) {
                    clearLocalHistories();
                    toast.success("Riwayat berhasil dibersihkan.");
                  }
                }}
                className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Riwayat</span>
              </ButtonApp>
            </>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-[#161F30] border border-[#26334D] rounded-[12px] p-3.5 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <InputApp
            placeholder="Cari nama file atau kode bahasa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-[#94A3B8] font-mono">
          {filtered.length} dari {localHistories.length} item
        </div>
      </div>

      {/* History Items Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#161F30] border border-[#26334D] rounded-[12px] p-12 text-center text-xs text-[#94A3B8]">
          <FileText className="w-8 h-8 mx-auto mb-2 text-[#94A3B8]/50" />
          Belum ada riwayat terjemahan yang disimpan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-[#161F30] border border-[#26334D] rounded-[12px] p-5 flex flex-col justify-between hover:border-[#E95420]/40 transition-all space-y-4 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-[8px] bg-[#1C273C] text-[#E95420]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#F8FAFC] truncate max-w-[200px]">
                        {item.file_name}
                      </h4>
                      <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 font-mono mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  <BadgeApp intent="success" size="xs">
                    {item.status}
                  </BadgeApp>
                </div>

                <div className="mt-4 pt-3 border-t border-[#26334D] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">Bahasa</span>
                    <span className="font-mono text-[#F8FAFC]">{item.source_lang} → {item.target_lang}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">Progres</span>
                    <span className="font-mono text-[#10B981] font-semibold">{item.translated_strings} / {item.total_strings} string</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#26334D]">
                <button
                  type="button"
                  onClick={() => {
                    deleteLocalHistory(item.id);
                    toast.success("Riwayat dihapus.");
                  }}
                  className="text-xs text-[#94A3B8] hover:text-[#EF4444] flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>

                <ButtonApp
                  intent="primary"
                  size="sm"
                  onClick={() => handleOpenInEditor(item)}
                  className="gap-1.5 text-xs"
                >
                  <span>Buka Ulang di Editor</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </ButtonApp>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
