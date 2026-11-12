import * as React from "react";
import { useOutletContext } from "react-router";
import { LayoutDashboard, BookOpen, Users, ShieldCheck, Lock } from "lucide-react";
import { GithubIcon } from "@/components/atoms/GithubIcon";
import { useAuthStore } from "@/store/useAuthStore";
import { ButtonApp } from "@/components/atoms/ButtonApp";
import { BadgeApp } from "@/components/atoms/BadgeApp";
import { ActivitySummary } from "@/components/organisms/ActivitySummary";
import { DocsViewer } from "@/components/organisms/DocsViewer";
import { ContributorsWall } from "@/components/organisms/ContributorsWall";

interface ContextType {
  onOpenApiKeyModal: () => void;
  onOpenAuthModal: () => void;
}

export function DashboardPage() {
  const { onOpenApiKeyModal, onOpenAuthModal } = useOutletContext<ContextType>();
  const { isAuthenticated, githubUsername } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState<"summary" | "docs" | "community">("summary");

  // Jika BELUM LOGIN: Tampilan Awal hanya menampilkan Panduan (Guides) dan Teks Keamanan
  if (!isAuthenticated) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Hero Header untuk Pengunjung / Tamu */}
        <div className="bg-gradient-to-br from-[#161F30] to-[#1C273C] border border-[#26334D] rounded-[16px] p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <BadgeApp intent="primary" size="xs">
              Open-Source Edition
            </BadgeApp>
            <BadgeApp intent="success" size="xs">
              Penyimpanan Lokal Aman (BYOK)
            </BadgeApp>
            <BadgeApp intent="info" size="xs">
              Google Gemini Powered
            </BadgeApp>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
              Penerjemah GNU Gettext (.po) Berbasis AI
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl leading-relaxed">
              Solusi lokalisasi software terbuka dengan penjagaan otomatis placeholder variabel (
              <code className="text-[#E95420] font-mono">%s</code>, <code className="text-[#E95420] font-mono">&#123;name&#125;</code>, tag HTML)
              dan arsitektur zero-knowledge client-side vault.
            </p>
          </div>

          {/* Banner Ajakan Login untuk Membuka Fitur */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[12px] bg-[#0D131F]/70 border border-[#E95420]/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-[#E95420]/15 flex items-center justify-center text-[#E95420] shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#F8FAFC]">
                  Masuk untuk Mengakses Fitur Lengkap
                </h4>
                <p className="text-[11px] text-[#94A3B8]">
                  Workspace Editor PO, Terjemahan Batch AI, dan Riwayat tersimpan dapat diakses setelah login.
                </p>
              </div>
            </div>

            <ButtonApp
              intent="primary"
              size="md"
              onClick={onOpenAuthModal}
              className="gap-2 shrink-0 shadow-lg"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Masuk dengan GitHub</span>
            </ButtonApp>
          </div>
        </div>

        {/* Guides & Security Text Section (Wajib Ditampilkan di Tampilan Awal) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#E95420]" />
              <span>Panduan Penggunaan & Privasi</span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-[#10B981]">
              <ShieldCheck className="w-4 h-4" />
              <span>Penyimpanan Lokal Mandiri</span>
            </div>
          </div>

          <DocsViewer defaultTab="user-guide" />
        </div>
      </div>
    );
  }

  // Jika SUDAH LOGIN: Tampilkan Dashboard Terpadu Lengkap
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#26334D] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">
              Dashboard Terpadu
            </h1>
            <BadgeApp intent="success" size="xs">
              @{githubUsername || "Pengguna"}
            </BadgeApp>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Pusat kendali pelokalan GNU Gettext bertenaga Google Gemini
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#161F30] border border-[#26334D] rounded-[8px]">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
              activeTab === "summary"
                ? "bg-[#E95420] text-white shadow-sm"
                : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C273C]"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Workspace & Status</span>
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
              activeTab === "docs"
                ? "bg-[#E95420] text-white shadow-sm"
                : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C273C]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Panduan & Keamanan</span>
          </button>

          <button
            onClick={() => setActiveTab("community")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
              activeTab === "community"
                ? "bg-[#E95420] text-white shadow-sm"
                : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C273C]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Kontributor & Komunitas</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "summary" && (
        <ActivitySummary onOpenApiKeyModal={onOpenApiKeyModal} />
      )}

      {activeTab === "docs" && (
        <DocsViewer />
      )}

      {activeTab === "community" && (
        <ContributorsWall />
      )}
    </div>
  );
}
