import * as React from "react";
import { User, Loader2, CheckCircle2, LogOut } from "lucide-react";
import { GithubIcon } from "@/components/atoms/GithubIcon";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabase-error";
import { useAuthStore } from "@/store/useAuthStore";
import { ButtonApp } from "@/components/atoms/ButtonApp";
import { InputApp } from "@/components/atoms/InputApp";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const {
    isAuthenticated,
    githubUsername,
    githubAvatar,
    signInWithGithub,
    signInMockGithub,
    signOut,
    setUser,
  } = useAuthStore();

  const [mode, setMode] = React.useState<"signin" | "signup" | "manual-github">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [githubInput, setGithubInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  if (!isOpen) return null;

  const handleGitHubAuth = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await signInWithGithub();
      } else {
        setMode("manual-github");
      }
    } catch (err) {
      toast.error(getSupabaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleManualGithubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubInput.trim()) {
      toast.error("Masukkan username GitHub Anda.");
      return;
    }
    const cleanName = githubInput.trim().replace(/^@/, "");
    signInMockGithub(cleanName);
    toast.success(`Berhasil masuk sebagai kontributor @${cleanName}!`);
    onClose();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.info("Supabase belum terkonfigurasi di environment. Gunakan opsi masuk dengan GitHub.");
      setMode("manual-github");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Berhasil masuk ke akun!");
        setUser(data.user, data.session);
        onClose();
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Pendaftaran berhasil! Silakan periksa email verifikasi Anda.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(getSupabaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Berhasil keluar dari akun.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#161F30] border border-[#26334D] rounded-[12px] p-6 shadow-2xl text-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#26334D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E95420]/15 rounded-[8px] text-[#E95420]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">
                {isAuthenticated ? "Profil Akun Kontributor" : "Masuk ke Akun"}
              </h2>
              <p className="text-xs text-[#94A3B8]">
                {isAuthenticated
                  ? "Sesi Terotentikasi & Siap Berkontribusi"
                  : "Buka fitur Workspace, Terjemahan AI, & Glosarium"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#F8FAFC] p-1.5 rounded-[6px] hover:bg-[#1C273C] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#1C273C] rounded-[8px] border border-[#26334D] text-xs space-y-3">
                <div className="flex items-center gap-3">
                  {githubAvatar ? (
                    <img
                      src={githubAvatar}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#E95420]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#E95420]/20 flex items-center justify-center text-[#E95420]">
                      <GithubIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-sm text-[#F8FAFC]">
                      @{githubUsername || "Pengguna Terotentikasi"}
                    </div>
                    <div className="text-[11px] text-[#10B981] flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sesi Aktif • Akses Fitur Terbuka</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#26334D] text-[11px] text-[#94A3B8] space-y-1">
                  <div>• Workspace Editor PO & Terjemah Otomatis: <strong>Aktif</strong></div>
                  <div>• Hak Menambah Kosakata Glosarium Komunitas: <strong>Diizinkan</strong></div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ButtonApp
                  intent="destructive"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Akun</span>
                </ButtonApp>
                <ButtonApp
                  intent="secondary"
                  size="sm"
                  onClick={onClose}
                  className="w-full"
                >
                  Tutup
                </ButtonApp>
              </div>
            </div>
          ) : mode === "manual-github" ? (
            <form onSubmit={handleManualGithubSubmit} className="space-y-3">
              <div className="p-3 bg-[#1C273C] rounded-[8px] border border-[#26334D] text-xs text-[#94A3B8] space-y-1">
                <div className="font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                  <GithubIcon className="w-3.5 h-3.5 text-[#E95420]" />
                  <span>Masuk dengan Profil GitHub</span>
                </div>
                <p>
                  Masukkan username GitHub Anda untuk mencatat kontribusi penambahan glosarium dan membuka seluruh fitur.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#94A3B8]">Username GitHub</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#94A3B8]">@</span>
                  <InputApp
                    type="text"
                    placeholder="misal: octocat"
                    value={githubInput}
                    onChange={(e) => setGithubInput(e.target.value)}
                    required
                    autoFocus
                    className="pl-7 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <ButtonApp
                  intent="secondary"
                  size="md"
                  type="button"
                  onClick={() => setMode("signin")}
                  className="w-full"
                >
                  Kembali
                </ButtonApp>
                <ButtonApp
                  intent="primary"
                  size="md"
                  type="submit"
                  className="w-full gap-2"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>Konfirmasi Masuk</span>
                </ButtonApp>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* GitHub OAuth Button */}
              <ButtonApp
                type="button"
                intent="primary"
                size="md"
                className="w-full gap-2 shadow-md"
                onClick={handleGitHubAuth}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GithubIcon className="w-4 h-4" />}
                <span>Masuk dengan GitHub (Disarankan)</span>
              </ButtonApp>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#26334D] w-full" />
                <span className="bg-[#161F30] px-3 text-[10px] uppercase tracking-wider text-[#94A3B8]">
                  atau opsi lain
                </span>
              </div>

              {/* Input Username GitHub Cepat */}
              <ButtonApp
                type="button"
                intent="secondary"
                size="sm"
                onClick={() => setMode("manual-github")}
                className="w-full gap-2 text-xs"
              >
                <GithubIcon className="w-3.5 h-3.5 text-[#E95420]" />
                <span>Masuk Cepat via Username GitHub</span>
              </ButtonApp>

              {/* Email Form if Supabase is active */}
              {isSupabaseConfigured && (
                <form onSubmit={handleEmailSubmit} className="space-y-3 pt-2 border-t border-[#26334D]">
                  <div className="space-y-1">
                    <label className="text-xs text-[#94A3B8]">Alamat Email</label>
                    <InputApp
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#94A3B8]">Kata Sandi</label>
                    <InputApp
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <ButtonApp
                    intent="secondary"
                    size="md"
                    type="submit"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : mode === "signin" ? (
                      "Masuk via Email"
                    ) : (
                      "Daftar Akun"
                    )}
                  </ButtonApp>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
