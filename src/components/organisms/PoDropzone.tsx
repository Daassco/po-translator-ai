import * as React from "react";
import { UploadCloud, FileText, CheckCircle2, Sparkles } from "lucide-react";
import { parsePo, type PoFile } from "@/lib/po-parser";
import { useAppStore } from "@/store/useAppStore";
import { ButtonApp } from "@/components/atoms/ButtonApp";
import { toast } from "sonner";

const SAMPLE_PO_CONTENT = `# Sample GNU Gettext .po translation file for testing
msgid ""
msgstr ""
"Project-Id-Version: WordPress Plugin 6.4\\n"
"Report-Msgid-Bugs-To: https://wordpress.org/support\\n"
"POT-Creation-Date: 2026-01-10 12:00+0000\\n"
"PO-Revision-Date: \\n"
"Language: id_ID\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Plural-Forms: nplurals=1; plural=0;\\n"

#: wp-admin/includes/user.php:120
msgid "Welcome back, %s! You have %d pending tasks."
msgstr ""

#: wp-admin/includes/post.php:45
msgid "Publish changes"
msgstr ""

#: wp-admin/menu.php:88
msgctxt "admin menu"
msgid "Settings & Preferences"
msgstr ""

#: wp-includes/general.php:210
msgid "Please check your email address: <a href=\\"mailto:%s\\">%s</a>"
msgstr ""

#: wp-includes/theme.php:90
msgid "Error: Theme directory <code>%s</code> does not exist."
msgstr ""

#: wp-admin/options.php:512
msgid "Save all changes immediately"
msgstr ""
`;

interface PoDropzoneProps {
  onFileLoaded?: (fileName: string, poFile: PoFile) => void;
}

export function PoDropzone({ onFileLoaded }: PoDropzoneProps) {
  const { setCurrentFile, currentFileName, currentPoFile } = useAppStore();
  const [isDragging, setIsDragging] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.name.endsWith(".po") && !file.name.endsWith(".pot")) {
      toast.error("Format file tidak didukung. Harap unggah file .po atau .pot");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Ukuran file melebihi batas maksimal 15 MB.");
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parsePo(content);

        if (parsed.entries.length === 0) {
          toast.warning("File .po ini tidak memuat baris string (msgid) untuk diterjemahkan.");
        } else {
          toast.success(`Berhasil mengurai ${parsed.entries.length} baris teks dari ${file.name}`);
        }

        setCurrentFile(file.name, parsed);
        if (onFileLoaded) onFileLoaded(file.name, parsed);
      } catch (err: unknown) {
        console.error(err);
        toast.error("Gagal mengurai file .po. Pastikan format sintaks valid.");
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      toast.error("Gagal membaca file dari penyimpanan lokal.");
      setIsLoading(false);
    };

    reader.readAsText(file, "UTF-8");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = () => {
    const parsed = parsePo(SAMPLE_PO_CONTENT);
    setCurrentFile("sample-wordpress-plugin.po", parsed, "en_US", "id_ID");
    toast.success("Berhasil memuat file .po contoh (WordPress Plugin)");
    if (onFileLoaded) onFileLoaded("sample-wordpress-plugin.po", parsed);
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-[12px] p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-[#E95420] bg-[#E95420]/10"
            : "border-[#26334D] hover:border-[#E95420]/60 bg-[#161F30]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".po,.pot"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3.5 bg-[#1C273C] border border-[#26334D] rounded-[10px] text-[#E95420]">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#F8FAFC]">
              {isLoading ? "Sedang memproses file..." : "Tarik & lepas file .po di sini"}
            </h3>
            <p className="text-xs text-[#94A3B8] mt-1">
              Atau klik untuk memilih file dari komputer Anda (Maksimal 15 MB)
            </p>
          </div>
        </div>
      </div>

      {/* Quick Sample File Button */}
      <div className="flex items-center justify-between text-xs text-[#94A3B8] px-1">
        <span>Belum memiliki file .po?</span>
        <ButtonApp
          type="button"
          intent="ghost"
          size="sm"
          onClick={handleLoadSample}
          className="text-[#E95420] hover:text-[#D04616] gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Muat Contoh File .PO Siap Pakai
        </ButtonApp>
      </div>

      {/* Loaded File Metadata Preview */}
      {currentPoFile && currentFileName && (
        <div className="bg-[#1C273C] border border-[#26334D] rounded-[8px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#161F30] rounded-[6px] text-[#E95420]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#F8FAFC]">{currentFileName}</div>
              <div className="text-xs text-[#94A3B8] flex items-center gap-2 mt-0.5 font-mono">
                <span>{currentPoFile.entries.length} baris string</span>
                <span>•</span>
                <span>Header: {currentPoFile.headers["Project-Id-Version"] || "GNU Gettext"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#10B981] flex items-center gap-1 font-medium bg-[#10B981]/10 px-2.5 py-1 rounded-[4px] border border-[#10B981]/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Siap Diterjemahkan
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
