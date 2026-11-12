import * as React from "react";
import { Plus, Search, Trash2, Edit2, Download, Upload, ShieldAlert, BookA, Users, Lock } from "lucide-react";
import { GithubIcon } from "@/components/atoms/GithubIcon";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ButtonApp } from "@/components/atoms/ButtonApp";
import { InputApp } from "@/components/atoms/InputApp";
import { BadgeApp } from "@/components/atoms/BadgeApp";
import { toast } from "sonner";
import type { Glossary } from "@/lib/supabase";

interface GlossaryManagerProps {
  onOpenAuthModal?: () => void;
}

export function GlossaryManager({ onOpenAuthModal }: GlossaryManagerProps) {
  const {
    localGlossaries,
    addLocalGlossary,
    updateLocalGlossary,
    deleteLocalGlossary,
    importLocalGlossaries,
  } = useAppStore();

  const { isAuthenticated, githubUsername, githubAvatar } = useAuthStore();

  const [search, setSearch] = React.useState("");
  const [filterTag, setFilterTag] = React.useState<string>("all");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Form State
  const [formSource, setFormSource] = React.useState("");
  const [formTarget, setFormTarget] = React.useState("");
  const [formTag, setFormTag] = React.useState("General");
  const [formDnt, setFormDnt] = React.useState(false);
  const [formDesc, setFormDesc] = React.useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Distinct tags
  const tags = Array.from(new Set(localGlossaries.map((g) => g.project_tag || "General")));

  const filteredGlossaries = localGlossaries.filter((g) => {
    const matchesSearch =
      search === "" ||
      g.source_term.toLowerCase().includes(search.toLowerCase()) ||
      g.target_term.toLowerCase().includes(search.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterTag !== "all" && g.project_tag !== filterTag) return false;

    return true;
  });

  const openAddModal = () => {
    if (!isAuthenticated) {
      toast.warning("Anda harus masuk dengan akun GitHub terlebih dahulu untuk menambah istilah glosarium!");
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    setEditingId(null);
    setFormSource("");
    setFormTarget("");
    setFormTag("General");
    setFormDnt(false);
    setFormDesc("");
    setIsModalOpen(true);
  };

  const openEditModal = (glossary: Glossary) => {
    if (!isAuthenticated) {
      toast.warning("Anda harus masuk dengan akun GitHub terlebih dahulu untuk mengubah istilah glosarium!");
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    setEditingId(glossary.id);
    setFormSource(glossary.source_term);
    setFormTarget(glossary.target_term);
    setFormTag(glossary.project_tag);
    setFormDnt(glossary.is_do_not_translate);
    setFormDesc(glossary.description || "");
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSource.trim()) {
      toast.error("Istilah sumber (Source Term) wajib diisi.");
      return;
    }

    if (!formDnt && !formTarget.trim()) {
      toast.error("Istilah target wajib diisi jika bukan Do Not Translate.");
      return;
    }

    const contributorName = githubUsername || "community";
    const contributorAvatar = githubAvatar || `https://github.com/${contributorName}.png`;

    if (editingId) {
      updateLocalGlossary(editingId, {
        source_term: formSource.trim(),
        target_term: formDnt ? formSource.trim() : formTarget.trim(),
        project_tag: formTag.trim() || "General",
        is_do_not_translate: formDnt,
        description: formDesc.trim(),
        contributor_name: contributorName,
        contributor_avatar: contributorAvatar,
      });
      toast.success("Istilah glosarium berhasil diperbarui.");
    } else {
      addLocalGlossary({
        source_term: formSource.trim(),
        target_term: formDnt ? formSource.trim() : formTarget.trim(),
        project_tag: formTag.trim() || "General",
        is_do_not_translate: formDnt,
        description: formDesc.trim(),
        contributor_name: contributorName,
        contributor_avatar: contributorAvatar,
      });
      toast.success(`Istilah baru berhasil ditambahkan oleh @${contributorName}!`);
    }

    setIsModalOpen(false);
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(localGlossaries, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glossary-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Glosarium berhasil diekspor ke format JSON!");
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      toast.warning("Anda harus masuk dengan akun GitHub terlebih dahulu untuk mengimpor istilah glosarium!");
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const contributorName = githubUsername || "community";
          importLocalGlossaries(
            parsed.map((item) => ({
              project_tag: item.project_tag || "Imported",
              source_term: item.source_term || item.source,
              target_term: item.target_term || item.target || item.source_term,
              is_do_not_translate: Boolean(item.is_do_not_translate || item.dnt),
              description: item.description || "",
              contributor_name: contributorName,
              contributor_avatar: githubAvatar || `https://github.com/${contributorName}.png`,
            }))
          );
          toast.success(`Berhasil mengimpor ${parsed.length} istilah glosarium!`);
        }
      } catch {
        toast.error("Format file JSON tidak valid.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161F30] border border-[#26334D] rounded-[12px] p-5">
        <div>
          <div className="flex items-center gap-2">
            <BookA className="w-5 h-5 text-[#E95420]" />
            <h2 className="text-base font-bold text-[#F8FAFC]">Kamus Glosarium Istilah</h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Pandu model Gemini untuk menerjemahkan istilah teknis atau mengabaikan (DNT) nama merek/variabel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={handleImportJson}
          />
          <ButtonApp
            intent="secondary"
            size="sm"
            onClick={() => {
              if (!isAuthenticated) {
                toast.warning("Anda harus masuk dengan akun GitHub terlebih dahulu untuk mengimpor istilah!");
                if (onOpenAuthModal) onOpenAuthModal();
                return;
              }
              fileInputRef.current?.click();
            }}
            className="gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>Impor</span>
          </ButtonApp>

          <ButtonApp
            intent="secondary"
            size="sm"
            onClick={handleExportJson}
            className="gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>Ekspor</span>
          </ButtonApp>

          <ButtonApp
            intent="primary"
            size="sm"
            onClick={openAddModal}
            className="gap-1.5 shadow-sm"
          >
            {isAuthenticated ? (
              <Plus className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
            )}
            <span>Tambah Istilah</span>
          </ButtonApp>
        </div>
      </div>

      {/* Community Contributor Banner */}
      <div className="bg-[#1C273C] border border-[#26334D] rounded-[10px] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#E95420]/15 flex items-center justify-center text-[#E95420] shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-[#F8FAFC] flex items-center gap-2">
              <span>Kamus Glosarium Terbuka Komunitas (Public Read)</span>
              <BadgeApp intent="info" size="xs">
                Open Source
              </BadgeApp>
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-0.5">
              {isAuthenticated
                ? `Anda masuk sebagai @${githubUsername || "kontributor"}. Setiap istilah baru yang Anda tambahkan akan diatribusikan ke akun Anda.`
                : "Semua orang dapat melihat kamus istilah. Untuk menambah kosakata baru, Anda wajib masuk dengan akun GitHub."}
            </div>
          </div>
        </div>

        {!isAuthenticated && (
          <ButtonApp
            intent="secondary"
            size="sm"
            onClick={onOpenAuthModal}
            className="gap-1.5 shrink-0"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>Masuk dengan GitHub</span>
          </ButtonApp>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#161F30] border border-[#26334D] rounded-[12px] p-3.5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <InputApp
            placeholder="Cari istilah sumber atau terjemahan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilterTag("all")}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors ${
              filterTag === "all"
                ? "bg-[#E95420] text-white"
                : "bg-[#1C273C] text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            Semua Tag ({localGlossaries.length})
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors ${
                filterTag === tag
                  ? "bg-[#E95420] text-white"
                  : "bg-[#1C273C] text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Terms */}
      <div className="bg-[#161F30] border border-[#26334D] rounded-[12px] overflow-hidden">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-[#1C273C] border-b border-[#26334D] text-[#94A3B8] uppercase text-[11px] font-semibold">
              <th className="py-3 px-4">Istilah Sumber (Source)</th>
              <th className="py-3 px-4">Terjemahan Wajib (Target)</th>
              <th className="py-3 px-4">Kategori Tag</th>
              <th className="py-3 px-4">Kontributor</th>
              <th className="py-3 px-4">Keterangan</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#26334D]">
            {filteredGlossaries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#94A3B8]">
                  Tidak ada istilah glosarium yang ditemukan.
                </td>
              </tr>
            ) : (
              filteredGlossaries.map((item) => (
                <tr key={item.id} className="hover:bg-[#1C273C]/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-[#F8FAFC]">
                    {item.source_term}
                  </td>
                  <td className="py-3.5 px-4">
                    {item.is_do_not_translate ? (
                      <BadgeApp intent="warning" size="xs" className="gap-1">
                        <ShieldAlert className="w-3 h-3" /> Jangan Diterjemahkan (DNT)
                      </BadgeApp>
                    ) : (
                      <span className="font-mono text-[#10B981]">{item.target_term}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <BadgeApp intent="default" size="xs">
                      {item.project_tag}
                    </BadgeApp>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      {item.contributor_avatar ? (
                        <img
                          src={item.contributor_avatar}
                          alt={item.contributor_name || "contributor"}
                          className="w-4 h-4 rounded-full object-cover border border-[#26334D]"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <GithubIcon className="w-3.5 h-3.5 text-[#94A3B8]" />
                      )}
                      <span className="font-mono text-[11px] text-[#38BDF8]">
                        @{item.contributor_name || "komunitas"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#94A3B8] max-w-xs truncate">
                    {item.description || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] rounded hover:bg-[#1C273C] transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        deleteLocalGlossary(item.id);
                        toast.success("Istilah glosarium dihapus.");
                      }}
                      className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] rounded hover:bg-[#1C273C] transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#161F30] border border-[#26334D] rounded-[12px] p-6 shadow-2xl text-[#F8FAFC]">
            <h3 className="text-base font-semibold mb-3">
              {editingId ? "Edit Istilah Glosarium" : "Tambah Istilah Glosarium Baru"}
            </h3>

            {/* Contributor Tag */}
            <div className="mb-4 flex items-center justify-between p-2.5 rounded-[8px] bg-[#1C273C] border border-[#26334D] text-xs">
              <div className="flex items-center gap-2">
                {githubAvatar ? (
                  <img
                    src={githubAvatar}
                    alt="avatar"
                    className="w-5 h-5 rounded-full object-cover border border-[#E95420]"
                  />
                ) : (
                  <GithubIcon className="w-4 h-4 text-[#E95420]" />
                )}
                <span className="text-[#94A3B8]">
                  Kontributor: <strong className="text-[#F8FAFC]">@{githubUsername || "kontributor"}</strong>
                </span>
              </div>
              <BadgeApp intent="success" size="xs">
                GitHub Verified
              </BadgeApp>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-[#94A3B8]">Istilah Sumber (Source Term) *</label>
                <InputApp
                  placeholder="Contoh: Pull Request"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  required
                />
              </div>

              {/* DNT Checkbox */}
              <label className="flex items-center gap-2 p-3 rounded-[8px] bg-[#1C273C] border border-[#26334D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formDnt}
                  onChange={(e) => setFormDnt(e.target.checked)}
                  className="rounded text-[#E95420] focus:ring-[#E95420]"
                />
                <div className="text-xs">
                  <div className="font-semibold text-[#F8FAFC]">Do Not Translate (DNT)</div>
                  <div className="text-[#94A3B8] text-[11px]">
                    Instruksikan AI agar istilah ini tidak pernah diubah
                  </div>
                </div>
              </label>

              {!formDnt && (
                <div className="space-y-1">
                  <label className="text-xs text-[#94A3B8]">Terjemahan Wajib (Target Term) *</label>
                  <InputApp
                    placeholder="Contoh: Permintaan Tarik"
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    required={!formDnt}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-[#94A3B8]">Kategori / Proyek Tag</label>
                <InputApp
                  placeholder="General / WordPress / Laravel"
                  value={formTag}
                  onChange={(e) => setFormTag(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#94A3B8]">Keterangan Singkat</label>
                <InputApp
                  placeholder="Konteks penggunaan..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#26334D]">
                <ButtonApp intent="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Batal
                </ButtonApp>
                <ButtonApp intent="primary" size="sm" type="submit">
                  Simpan Istilah
                </ButtonApp>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
