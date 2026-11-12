import * as React from "react";
import { Download, Copy, Check, Code2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { compilePo } from "@/lib/po-parser";
import { ButtonApp } from "@/components/atoms/ButtonApp";
import { InputApp } from "@/components/atoms/InputApp";
import { toast } from "sonner";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { currentPoFile, currentFileName, targetLang } = useAppStore();
  const [downloadFileName, setDownloadFileName] = React.useState("");
  const [isCopied, setIsCopied] = React.useState(false);
  const [compiledContent, setCompiledContent] = React.useState("");

  React.useEffect(() => {
    if (currentPoFile) {
      const compiled = compilePo(currentPoFile, targetLang);
      setCompiledContent(compiled);

      // Auto-suggest file name (e.g., messages-id_ID.po)
      const baseName = currentFileName.replace(/\.(po|pot)$/i, "");
      setDownloadFileName(`${baseName}-${targetLang}.po`);
    }
  }, [isOpen, currentPoFile, currentFileName, targetLang]);

  if (!isOpen || !currentPoFile) return null;

  const handleDownload = () => {
    try {
      const blob = new Blob([compiledContent], { type: "text/x-gettext-translation;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFileName.endsWith(".po") ? downloadFileName : `${downloadFileName}.po`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`File ${downloadFileName} berhasil diunduh! Siap dikompilasi ke .mo`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh file.");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compiledContent);
      setIsCopied(true);
      toast.success("Seluruh teks mentah .po berhasil disalin ke clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin ke clipboard.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#161F30] border border-[#26334D] rounded-[12px] p-6 shadow-2xl text-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#26334D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E95420]/15 rounded-[8px] text-[#E95420]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">Unduh Hasil Terjemahan (.PO)</h2>
              <p className="text-xs text-[#94A3B8]">
                Kompilasi Gettext standar dengan header PO-Revision-Date terbaru
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#F8FAFC] p-1.5 rounded-[6px] hover:bg-[#1C273C] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A3B8]">Nama File Unduhan</label>
            <InputApp
              value={downloadFileName}
              onChange={(e) => setDownloadFileName(e.target.value)}
              placeholder="messages-id_ID.po"
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#94A3B8] flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#E95420]" />
                <span>Pratinjau Kode .PO Mentah</span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-[#E95420] hover:text-[#D04616] flex items-center gap-1 transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? "Tersalin!" : "Salin Teks Mentah"}
              </button>
            </div>
            <textarea
              readOnly
              rows={8}
              value={compiledContent}
              className="w-full bg-[#0D131F] text-[#94A3B8] font-mono text-[11px] p-3 rounded-[8px] border border-[#26334D] focus:outline-none resize-none leading-relaxed select-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#26334D]">
          <ButtonApp intent="ghost" size="sm" onClick={onClose}>
            Batal
          </ButtonApp>
          <div className="flex items-center gap-2">
            <ButtonApp intent="secondary" size="sm" onClick={handleCopy}>
              <Copy className="w-3.5 h-3.5" /> Salin Teks
            </ButtonApp>
            <ButtonApp intent="primary" size="sm" onClick={handleDownload}>
              <Download className="w-3.5 h-3.5" /> Unduh File .PO
            </ButtonApp>
          </div>
        </div>
      </div>
    </div>
  );
}
