import { Link, useOutletContext } from "react-router";
import { Lock } from "lucide-react";
import { GithubIcon } from "@/components/atoms/GithubIcon";
import { useAuthStore } from "@/store/useAuthStore";
import { ButtonApp } from "@/components/atoms/ButtonApp";
import { HistoryManager } from "@/components/organisms/HistoryManager";

interface ContextType {
  onOpenAuthModal: () => void;
}

export function HistoryPage() {
  const { onOpenAuthModal } = useOutletContext<ContextType>();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="bg-[#161F30] border border-[#26334D] rounded-[16px] p-8 text-center max-w-lg mx-auto mt-12 space-y-4 shadow-xl animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-full bg-[#E95420]/15 flex items-center justify-center text-[#E95420] mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[#F8FAFC]">
            Riwayat Terjemahan Terkunci
          </h2>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Riwayat pengerjaan file GNU Gettext dan sinkronisasi cloud hanya dapat diakses setelah Anda masuk dengan akun GitHub.
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
      <HistoryManager />
    </div>
  );
}
