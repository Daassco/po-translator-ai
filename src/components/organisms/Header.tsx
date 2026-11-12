import { Star, Lock, Unlock, ShieldAlert, Zap } from "lucide-react";
import { GithubIcon } from "@/components/atoms/GithubIcon";
import { useAppStore } from "@/store/useAppStore";
import { useVaultStore } from "@/store/useVaultStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getProviderConfig } from "@/lib/ai-providers";
import { BadgeApp } from "@/components/atoms/BadgeApp";
import { ButtonApp } from "@/components/atoms/ButtonApp";

interface HeaderProps {
  onOpenApiKeyModal: () => void;
  onOpenAuthModal: () => void;
}

export function Header({ onOpenApiKeyModal, onOpenAuthModal }: HeaderProps) {
  const { preferredModel, aiProvider, isComboEnabled } = useAppStore();
  const { encryptedVault, isUnlocked, lockVault } = useVaultStore();
  const { isAuthenticated, githubUsername, githubAvatar } = useAuthStore();
  const provConfig = getProviderConfig(aiProvider || "gemini");
  const hasEnvKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

  return (
    <header className="h-14 px-6 bg-[#161F30]/80 backdrop-blur-md border-b border-[#26334D] flex items-center justify-between sticky top-0 z-30 select-none shrink-0">
      {/* Left: Model, Crypto Vault & Combo Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenApiKeyModal}
          className="flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[#1C273C] border border-[#26334D] hover:border-[#E95420]/50 transition-colors text-xs cursor-pointer"
          title="Klik untuk membuka/mengunci Crypto Vault dan mengatur Fitur Combo Model"
        >
          {encryptedVault ? (
            isUnlocked ? (
              <Unlock className="w-3.5 h-3.5 text-[#10B981]" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
            )
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-[#E95420]" />
          )}

          <span className="font-mono text-[#F8FAFC]">
            <span className="text-[#94A3B8] font-sans mr-1 font-medium">{provConfig.name.split(" ")[0]}:</span>
            {preferredModel}
          </span>

          {encryptedVault ? (
            isUnlocked ? (
              <BadgeApp intent="success" size="xs">
                Vault Terbuka (RAM)
              </BadgeApp>
            ) : (
              <BadgeApp intent="warning" size="xs">
                Terkunci (Perlu PIN)
              </BadgeApp>
            )
          ) : (aiProvider === "gemini" && hasEnvKey) ? (
            <BadgeApp intent="info" size="xs">
              Env Aktif
            </BadgeApp>
          ) : !provConfig.requiresKey ? (
            <BadgeApp intent="success" size="xs">
              Lokal / Bebas Biaya
            </BadgeApp>
          ) : (
            <BadgeApp intent="error" size="xs">
              Siapkan PIN Vault
            </BadgeApp>
          )}

          {isComboEnabled && aiProvider !== "google_translate" && (
            <span
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#E95420]/20 text-[#E95420] text-[10px] font-semibold border border-[#E95420]/30"
              title="Fitur Combo AI Aktif: otomatis beralih ke model cadangan saat kena limit/kuota habis"
            >
              <Zap className="w-3 h-3 text-[#E95420]" />
              Combo
            </span>
          )}
        </button>

        {isUnlocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              lockVault();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] text-[11px] font-medium border border-[#EF4444]/30 transition-colors cursor-pointer"
            title="Kunci sesi sekarang (hapus kunci dari RAM)"
          >
            <Lock className="w-3 h-3" />
            <span>Kunci RAM</span>
          </button>
        )}
      </div>

      {/* Right: GitHub Stars & Account */}
      <div className="flex items-center gap-3">
        <a
          href={`https://github.com/${import.meta.env.VITE_GITHUB_REPO || "Daassco/po-translator-ai"}`}
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#1C273C] hover:bg-[#26334D] border border-[#26334D] text-xs text-[#F8FAFC] transition-colors"
        >
          <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
          <span className="font-medium">Star di GitHub</span>
          <span className="text-[10px] bg-[#161F30] px-1.5 py-0.5 rounded text-[#94A3B8]">
            1.2k
          </span>
        </a>

        {isAuthenticated ? (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] bg-[#1C273C] hover:bg-[#26334D] border border-[#26334D] text-xs transition-colors cursor-pointer"
          >
            {githubAvatar ? (
              <img
                src={githubAvatar}
                alt="Avatar"
                className="w-5 h-5 rounded-full object-cover border border-[#E95420]"
              />
            ) : (
              <GithubIcon className="w-4 h-4 text-[#E95420]" />
            )}
            <span className="font-medium text-[#F8FAFC]">
              @{githubUsername || "Pengguna"}
            </span>
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          </button>
        ) : (
          <ButtonApp
            intent="primary"
            size="sm"
            onClick={onOpenAuthModal}
            className="gap-2 shadow-sm"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>Masuk Akun</span>
          </ButtonApp>
        )}
      </div>
    </header>
  );
}
