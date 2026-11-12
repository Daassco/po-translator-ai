import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Languages,
  History,
  BookA,
  Sparkles,
  Lock,
  Unlock,
  ShieldCheck,
} from "lucide-react";
import { GithubIcon } from "@/components/atoms/GithubIcon";
import { useAppStore } from "@/store/useAppStore";
import { useVaultStore } from "@/store/useVaultStore";
import { useAuthStore } from "@/store/useAuthStore";
import { BadgeApp } from "@/components/atoms/BadgeApp";

interface SidebarProps {
  onOpenApiKeyModal: () => void;
  onOpenAuthModal?: () => void;
}

export function Sidebar({ onOpenApiKeyModal }: SidebarProps) {
  const location = useLocation();
  const { localHistories, localGlossaries, aiProvider } = useAppStore();
  const { encryptedVault, isUnlocked } = useVaultStore();
  const { isAuthenticated } = useAuthStore();
  const hasEnvKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY);
  const isGeminiEnv = aiProvider === "gemini" && hasEnvKey;

  const navItems = [
    {
      label: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      badge: null,
      requiresAuth: false,
    },
    {
      label: "Terjemah PO",
      path: "/translator",
      icon: Languages,
      badge: !isAuthenticated ? "Kunci" : null,
      requiresAuth: true,
    },
    {
      label: "Riwayat",
      path: "/history",
      icon: History,
      badge: !isAuthenticated ? "Kunci" : localHistories.length > 0 ? String(localHistories.length) : null,
      requiresAuth: true,
    },
    {
      label: "Glosarium",
      path: "/glossary",
      icon: BookA,
      badge: localGlossaries.length > 0 ? String(localGlossaries.length) : null,
      requiresAuth: false,
    },
  ];

  return (
    <aside className="w-[240px] shrink-0 h-screen bg-[#161F30] border-r border-[#26334D] flex flex-col justify-between select-none sticky top-0 z-20">
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Brand Logo */}
        <div className="h-14 px-5 border-b border-[#26334D] flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-[#E95420] to-[#F59E0B] flex items-center justify-center text-white shadow-sm font-bold text-base">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#F8FAFC] tracking-tight flex items-center gap-1.5">
              Penerjemah PO <span className="text-[#E95420] text-xs font-mono font-semibold">AI</span>
            </div>
            <div className="text-[10px] text-[#94A3B8] tracking-wider">Open-Source Edition</div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-3 space-y-1 flex-1">
          <div className="px-3 py-2 text-[10px] font-semibold tracking-wider uppercase text-[#94A3B8]/70">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-[8px] text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#E95420]/15 text-[#E95420] border border-[#E95420]/30 font-semibold"
                    : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C273C]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#E95420]" : "text-[#94A3B8]"}`} />
                  <span>{item.label}</span>
                </div>
                {item.requiresAuth && !isAuthenticated ? (
                  <span className="flex items-center gap-1 text-[10px] text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded border border-[#F59E0B]/20">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Login</span>
                  </span>
                ) : item.badge ? (
                  <BadgeApp
                    intent={isActive ? "primary" : "default"}
                    size="xs"
                  >
                    {item.badge}
                  </BadgeApp>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions & Community */}
      <div className="p-3 border-t border-[#26334D] space-y-1.5 shrink-0 bg-[#161F30]">
        <button
          onClick={onOpenApiKeyModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] bg-[#1C273C] hover:bg-[#1C273C]/80 border border-[#26334D] text-left transition-colors text-xs text-[#F8FAFC]"
        >
          <div className="flex items-center gap-2">
            {encryptedVault ? (
              isUnlocked ? (
                <Unlock className="w-3.5 h-3.5 text-[#10B981]" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
              )
            ) : isGeminiEnv ? (
              <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
            )}
            <span>
              {encryptedVault
                ? isUnlocked
                  ? "Vault Terbuka"
                  : "Vault Terkunci"
                : isGeminiEnv
                ? "Kunci .env Aktif"
                : "Kunci API & PIN"}
            </span>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              encryptedVault && isUnlocked
                ? "bg-[#10B981]"
                : encryptedVault && !isUnlocked
                ? "bg-[#F59E0B] animate-pulse"
                : isGeminiEnv
                ? "bg-[#38BDF8]"
                : "bg-[#EF4444]"
            }`}
          />
        </button>

        <a
          href={`https://github.com/${import.meta.env.VITE_GITHUB_REPO || "Daassco/po-translator-ai"}`}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C273C] transition-colors"
        >
          <GithubIcon className="w-3.5 h-3.5" />
          <span>GitHub Repository</span>
          <span className="ml-auto text-[10px] text-[#94A3B8]">★ 1.2k</span>
        </a>
      </div>
    </aside>
  );
}
