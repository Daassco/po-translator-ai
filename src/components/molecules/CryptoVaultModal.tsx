import * as React from "react";
import {
  KeyRound,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Cpu,
  Zap,
  HardDrive,
  Globe,
  Server,
} from "lucide-react";
import { useVaultStore, sanitizeApiKey } from "@/store/useVaultStore";
import { useAppStore } from "@/store/useAppStore";
import { testAiConnection } from "@/lib/gemini";
import {
  PROVIDER_LIST,
  getProviderConfig,
  type AiProvider,
} from "@/lib/ai-providers";
import { ButtonApp } from "@/components/atoms/ButtonApp";
import { InputApp } from "@/components/atoms/InputApp";
import { toast } from "sonner";
import {
  checkActionCooldown,
  getPinLockoutStatus,
  recordFailedPinAttempt,
  resetPinAttempts,
} from "@/lib/rate-limiter";
import { validateAndSanitizeBaseUrl } from "@/lib/url-validator";

interface CryptoVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CryptoVaultModal({ isOpen, onClose }: CryptoVaultModalProps) {
  const {
    encryptedVault,
    sessionApiKey,
    isUnlocked,
    setupVault,
    unlockVault,
    lockVault,
    resetVault,
    getEffectiveApiKey,
  } = useVaultStore();

  const {
    aiProvider,
    apiBaseUrl,
    preferredModel,
    isComboEnabled,
    comboChain,
    setAiProvider,
    setApiBaseUrl,
    setPreferredModel,
    setIsComboEnabled,
  } = useAppStore();

  // Active Provider Selection
  const [selectedProvider, setSelectedProvider] = React.useState<AiProvider>(
    aiProvider || "gemini"
  );
  const activeConfig = getProviderConfig(selectedProvider);

  // Base URL & Model inputs
  const [baseUrlInput, setBaseUrlInput] = React.useState(
    apiBaseUrl || activeConfig.defaultBaseUrl
  );
  const [selectedModel, setSelectedModel] = React.useState(
    preferredModel || activeConfig.defaultModel
  );

  // Form States for API Key & PIN
  const [apiKeyInput, setApiKeyInput] = React.useState("");
  const [pinInput, setPinInput] = React.useState("");
  const [confirmPinInput, setConfirmPinInput] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isEditingKey, setIsEditingKey] = React.useState(false);

  // Lockout State
  const [lockoutSec, setLockoutSec] = React.useState(0);

  // Test Connection State
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Check lockout on mount/open
  React.useEffect(() => {
    if (isOpen) {
      const lockStatus = getPinLockoutStatus();
      setLockoutSec(lockStatus.remainingSeconds);

      const activeProv = useAppStore.getState().aiProvider || "gemini";
      setSelectedProvider(activeProv);
      const provConfig = getProviderConfig(activeProv);
      setBaseUrlInput(useAppStore.getState().apiBaseUrl || provConfig.defaultBaseUrl);
      setSelectedModel(useAppStore.getState().preferredModel || provConfig.defaultModel);

      // If unlocked, load session key
      const currentSessionKey = useVaultStore.getState().sessionApiKey || "";
      setApiKeyInput(currentSessionKey);
      setPinInput("");
      setConfirmPinInput("");
      setTestResult(null);
      setIsEditingKey(false);
    }
  }, [isOpen]);

  // Countdown for PIN lockout
  React.useEffect(() => {
    if (lockoutSec <= 0) return;
    const timer = setInterval(() => {
      setLockoutSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSec]);

  if (!isOpen) return null;

  // Handle Provider Switch
  const handleSelectProvider = (newProv: AiProvider) => {
    setSelectedProvider(newProv);
    const newConfig = getProviderConfig(newProv);
    setBaseUrlInput(newConfig.defaultBaseUrl);
    setSelectedModel(newConfig.defaultModel);
    setTestResult(null);
    setAiProvider(newProv, newConfig.defaultModel, newConfig.defaultBaseUrl);
  };

  // Setup Vault with PIN (AES-GCM 256-bit + PBKDF2)
  const handleSetupVault = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = sanitizeApiKey(apiKeyInput);

    if (!cleanKey && activeConfig.requiresKey) {
      toast.error(`Harap masukkan API Key untuk ${activeConfig.name}.`);
      return;
    }

    if (pinInput.length < 6) {
      toast.error("PIN Master minimal harus 6 karakter untuk keamanan AES-GCM.");
      return;
    }

    if (pinInput !== confirmPinInput) {
      toast.error("Konfirmasi PIN tidak cocok dengan PIN Master.");
      return;
    }

    setIsProcessing(true);
    try {
      await setupVault(cleanKey, pinInput);
      resetPinAttempts();
      setPinInput("");
      setConfirmPinInput("");
      setIsEditingKey(false);
      setAiProvider(selectedProvider, selectedModel, baseUrlInput);
      toast.success(
        "Crypto Vault berhasil dibuat! Kunci Anda dienkripsi AES-GCM 256-bit dan aktif di RAM."
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Gagal membuat Crypto Vault.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Unlock Vault with PIN
  const handleUnlockVault = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutSec > 0) {
      toast.error(`Terlalu banyak percobaan salah! Harap tunggu ${lockoutSec} detik.`);
      return;
    }

    if (!pinInput) {
      toast.error("Harap masukkan PIN Master Anda.");
      return;
    }

    setIsProcessing(true);
    try {
      const ok = await unlockVault(pinInput);
      if (ok) {
        resetPinAttempts();
        setPinInput("");
        setApiKeyInput(useVaultStore.getState().sessionApiKey || "");
        toast.success("Crypto Vault terbuka! API Key dimuat ke memori RAM.");
      } else {
        const attempt = recordFailedPinAttempt();
        if (attempt.isLocked) {
          setLockoutSec(attempt.lockoutSeconds);
          toast.error(
            `PIN salah 5x! Vault terkunci sementara selama ${attempt.lockoutSeconds} detik.`
          );
        } else {
          toast.error(
            `PIN salah! Verifikasi dekripsi AES-GCM gagal. Sisa percobaan: ${attempt.remainingAttempts}`
          );
        }
      }
    } catch {
      toast.error("Terjadi kesalahan saat memverifikasi PIN.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Lock Vault immediately
  const handleLockNow = () => {
    lockVault();
    setApiKeyInput("");
    setPinInput("");
    toast.info("Crypto Vault dikunci. Kunci API telah dibersihkan dari RAM.");
  };

  // Reset Vault total
  const handleResetVault = () => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin mereset Crypto Vault? Kunci tersimpan akan dihapus dan Anda harus memasukkan kunci serta PIN baru."
      )
    ) {
      resetVault();
      setApiKeyInput("");
      setPinInput("");
      setConfirmPinInput("");
      setIsEditingKey(false);
      setTestResult(null);
      toast.info("Crypto Vault telah direset total.");
    }
  };

  // Real-time URL Security Validation for Custom/Ollama/OpenRouter
  const urlValidation = React.useMemo(() => {
    if (
      selectedProvider === "ollama" ||
      selectedProvider === "custom" ||
      selectedProvider === "openrouter"
    ) {
      return validateAndSanitizeBaseUrl(baseUrlInput);
    }
    return {
      isValid: true,
      sanitizedUrl: baseUrlInput,
      isLocal: false,
      isSecureHttps: true,
    };
  }, [selectedProvider, baseUrlInput]);

  // Test Connection with 2-second rate limit cooldown
  const handleTestConnection = async () => {
    if (!urlValidation.isValid) {
      toast.error(urlValidation.error || "Format Base URL tidak aman.");
      return;
    }

    const cooldown = checkActionCooldown("test_api_connection", 2000);
    if (!cooldown.allowed) {
      toast.warning(
        `Harap tunggu ${cooldown.waitSeconds} detik sebelum menguji koneksi lagi.`
      );
      return;
    }

    setIsProcessing(true);
    setTestResult(null);

    try {
      const cleanKey =
        sanitizeApiKey(apiKeyInput) || getEffectiveApiKey(selectedProvider);
      const res = await testAiConnection(
        selectedProvider,
        cleanKey,
        selectedModel,
        urlValidation.sanitizedUrl || baseUrlInput
      );
      setTestResult(res);

      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setTestResult({
        success: false,
        message: error.message || "Gagal menghubungkan ke endpoint.",
      });
      toast.error("Tes koneksi gagal.");
    } finally {
      setIsProcessing(false);
    }
  };

  const hasEnvKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY);
  const isGeminiEnv = selectedProvider === "gemini" && hasEnvKey && !encryptedVault;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#161F30] border border-[#26334D] rounded-[16px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#26334D] flex items-center justify-between bg-[#1C273C]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#E95420]/15 border border-[#E95420]/30 flex items-center justify-center text-[#E95420]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#F8FAFC]">
                  Crypto Vault & Pengaturan AI
                </h2>
                {encryptedVault ? (
                  isUnlocked ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded-full border border-[#10B981]/30">
                      <Unlock className="w-3 h-3" />
                      Vault Terbuka (RAM)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-[#F59E0B] bg-[#F59E0B]/15 px-2 py-0.5 rounded-full border border-[#F59E0B]/30">
                      <Lock className="w-3 h-3" />
                      Terkunci (Perlu PIN)
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-[#94A3B8] bg-[#1C273C] px-2 py-0.5 rounded-full border border-[#26334D]">
                    <ShieldAlert className="w-3 h-3 text-[#E95420]" />
                    Belum Dikonfigurasi
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Enkripsi AES-GCM 256-bit + Fitur Combo Auto-Failover saat Limit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#F8FAFC] text-sm p-1.5 rounded-[6px] hover:bg-[#1C273C] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Provider Selection Tabs */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
              1. Pilih Mesin / Penyedia Terjemahan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROVIDER_LIST.map((prov) => {
                const isSelected = selectedProvider === prov.id;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleSelectProvider(prov.id)}
                    className={`flex flex-col items-start p-2.5 rounded-[8px] border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#E95420]/15 border-[#E95420] text-[#F8FAFC] shadow-sm"
                        : "bg-[#1C273C] border-[#26334D] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#26334D]/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-semibold text-xs text-[#F8FAFC]">
                        {prov.name.split(" ")[0]}
                      </span>
                      {prov.id === "google_translate" ? (
                        <Globe className="w-3.5 h-3.5 text-[#10B981]" />
                      ) : prov.id === "ollama" ? (
                        <HardDrive className="w-3.5 h-3.5 text-[#38BDF8]" />
                      ) : prov.id === "groq" ? (
                        <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                      ) : (
                        <Cpu className="w-3.5 h-3.5 text-[#94A3B8]" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#94A3B8] line-clamp-1">
                      {prov.id === "google_translate"
                        ? "Bebas Kuota (Online)"
                        : prov.id === "ollama"
                        ? "Offline & Lokal"
                        : prov.id === "openrouter"
                        ? "Claude, GPT, Qwen"
                        : "Cloud AI API"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Provider Banner */}
          <div className="p-3 rounded-[8px] bg-[#1C273C]/60 border border-[#26334D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#94A3B8]">Penyedia Aktif:</span>
              <span className="font-semibold text-[#F8FAFC] text-xs">
                {activeConfig.name}
              </span>
              {!activeConfig.requiresKey && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#10B981]/15 text-[#10B981] font-medium border border-[#10B981]/30">
                  Gratis & Tanpa Kunci
                </span>
              )}
            </div>

            {activeConfig.keyUrl && (
              <a
                href={activeConfig.keyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1 font-medium"
              >
                Dapatkan API Key <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* SECTION 2: Crypto Vault (AES-GCM 256-bit + PIN) */}
          {activeConfig.requiresKey && (
            <div className="space-y-3 bg-[#0D131F] p-4 rounded-[12px] border border-[#26334D]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#E95420]" />
                  2. Keamanan Crypto Vault (Kunci API & PIN Master)
                </label>
                <div className="flex items-center gap-1 text-[10px] text-[#10B981]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Web Crypto AES-GCM 256-bit</span>
                </div>
              </div>

              {/* Case A: Vault exists and is LOCKED */}
              {encryptedVault && !isUnlocked && !isEditingKey ? (
                <div className="space-y-3 p-3.5 rounded-[8px] bg-[#161F30] border border-[#F59E0B]/30">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs text-[#F8FAFC]">
                        Crypto Vault Terkunci
                      </div>
                      <div className="text-[11px] text-[#94A3B8] mt-0.5">
                        Kunci tersimpan aman dalam bentuk ciphertext (
                        <span className="font-mono text-[#F8FAFC]">
                          {encryptedVault.maskedKey}
                        </span>
                        ). Masukkan PIN Master untuk membuka kunci ke memori RAM sesi ini.
                      </div>
                    </div>
                  </div>

                  {lockoutSec > 0 ? (
                    <div className="p-2.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Vault terkunci sementara akibat salah PIN. Coba lagi dalam{" "}
                        <strong className="font-mono">{lockoutSec}s</strong>.
                      </span>
                    </div>
                  ) : (
                    <form onSubmit={handleUnlockVault} className="space-y-2.5 pt-1">
                      <div className="flex items-center gap-2">
                        <InputApp
                          type="password"
                          placeholder="Masukkan PIN Master (6+ digit)..."
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          className="font-mono text-xs"
                          autoFocus
                        />
                        <ButtonApp
                          type="submit"
                          intent="primary"
                          disabled={isProcessing || !pinInput}
                          className="shrink-0 text-xs px-4 h-9"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5 mr-1" />
                          )}
                          Buka Kunci
                        </ButtonApp>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-[#94A3B8]">
                          Maks 5 percobaan gagal sebelum lockout 30 detik.
                        </span>
                        <button
                          type="button"
                          onClick={handleResetVault}
                          className="text-[10px] text-[#EF4444] hover:underline cursor-pointer"
                        >
                          Lupa PIN? Reset Vault
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : null}

              {/* Case B: Vault is UNLOCKED */}
              {encryptedVault && isUnlocked && !isEditingKey ? (
                <div className="space-y-3 p-3.5 rounded-[8px] bg-[#161F30] border border-[#10B981]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Unlock className="w-4 h-4 text-[#10B981]" />
                      <div>
                        <div className="font-semibold text-xs text-[#F8FAFC]">
                          Crypto Vault Terbuka di RAM
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">
                          Kunci API aktif di memori RAM dan otomatis terhapus saat ditutup.
                        </div>
                      </div>
                    </div>
                    <ButtonApp
                      size="sm"
                      intent="destructive"
                      onClick={handleLockNow}
                      className="text-xs h-7 px-2.5"
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      Kunci RAM
                    </ButtonApp>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded bg-[#0D131F] border border-[#26334D] font-mono text-xs">
                    <span className="text-[#38BDF8]">
                      {showKey ? sessionApiKey : encryptedVault.maskedKey}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors p-1"
                        title={showKey ? "Sembunyikan Kunci" : "Lihat Kunci Asli"}
                      >
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setApiKeyInput(sessionApiKey || "");
                          setIsEditingKey(true);
                        }}
                        className="text-[11px] text-[#38BDF8] hover:underline"
                      >
                        Perbarui Kunci / PIN
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Case C: Setting up New Vault OR Editing existing */}
              {(!encryptedVault || isEditingKey) && (
                <form onSubmit={handleSetupVault} className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-[#94A3B8]">
                        API Key {activeConfig.name}
                      </label>
                      {isGeminiEnv && (
                        <span className="text-[10px] text-[#38BDF8] font-mono">
                          (Tersedia fallback default dari file .env)
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <InputApp
                        type={showKey ? "text" : "password"}
                        placeholder={
                          isGeminiEnv
                            ? "Menggunakan VITE_GEMINI_API_KEY dari .env (ketik untuk menimpa)"
                            : activeConfig.keyPlaceholder || "Tempel API Key Anda di sini..."
                        }
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        className="pr-10 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC]"
                      >
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[#94A3B8]">
                        PIN Master (Min. 6 Karakter)
                      </label>
                      <InputApp
                        type="password"
                        placeholder="Buat PIN Master..."
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[#94A3B8]">
                        Konfirmasi PIN Master
                      </label>
                      <InputApp
                        type="password"
                        placeholder="Ulangi PIN Master..."
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#94A3B8] max-w-[320px]">
                      Kunci dienkripsi AES-GCM 256-bit + PBKDF2 100k iterasi. Plaintext tidak pernah disimpan di disk atau database.
                    </span>

                    <div className="flex items-center gap-2">
                      {isEditingKey && (
                        <ButtonApp
                          type="button"
                          size="sm"
                          intent="secondary"
                          onClick={() => setIsEditingKey(false)}
                          className="text-xs h-8 px-3"
                        >
                          Batal
                        </ButtonApp>
                      )}
                      <ButtonApp
                        type="submit"
                        size="sm"
                        intent="primary"
                        disabled={isProcessing || !apiKeyInput || pinInput.length < 6}
                        className="text-xs h-8 px-3.5 font-semibold"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        )}
                        Enkripsi & Simpan Vault
                      </ButtonApp>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* SECTION 3: Fitur Combo Model AI (Auto-Failover saat Limit) */}
          <div className="space-y-2.5 bg-[#0D131F] p-4 rounded-[12px] border border-[#26334D]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#E95420]" />
                <span className="text-xs font-semibold text-[#F8FAFC]">
                  3. Fitur Combo Model AI (Auto-Failover saat Limit / Quota Habis)
                </span>
              </div>

              {selectedProvider !== "google_translate" ? (
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isComboEnabled}
                    onChange={(e) => {
                      setIsComboEnabled(e.target.checked);
                      toast.success(
                        e.target.checked
                          ? "Fitur Combo AI diaktifkan! Auto-failover siap bekerja."
                          : "Fitur Combo AI dinonaktifkan."
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#1C273C] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E95420]"></div>
                </label>
              ) : null}
            </div>

            {selectedProvider === "google_translate" ? (
              <div className="p-3 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/20 text-xs text-[#10B981] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Google Translate beroperasi tanpa batas kuota API (20 RPD free), sehingga fitur Combo failover tidak diperlukan.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Jika model AI yang sedang berjalan terkena <strong>HTTP 429 (Rate Limit / Resource Exhausted)</strong> atau batas kuota harian habis, sistem secara otomatis beralih ke model cadangan berikutnya dan mengulang penerjemahan tanpa berhenti.
                </p>

                {isComboEnabled && (
                  <div className="p-2.5 rounded-[8px] bg-[#161F30] border border-[#26334D] space-y-1.5">
                    <div className="text-[10px] font-semibold text-[#F8FAFC] uppercase tracking-wider flex items-center justify-between">
                      <span>Urutan Failover Combo AI:</span>
                      <span className="text-[#10B981] lowercase">otomatis & mulus</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                      {comboChain.map((model, idx) => {
                        const isCurrent = preferredModel === model;
                        return (
                          <React.Fragment key={model}>
                            <span
                              className={`px-2 py-0.5 rounded border ${
                                isCurrent
                                  ? "bg-[#E95420]/20 text-[#E95420] border-[#E95420]/40 font-bold"
                                  : "bg-[#1C273C] text-[#94A3B8] border-[#26334D]"
                              }`}
                            >
                              {idx + 1}. {model} {isCurrent ? "(Aktif)" : ""}
                            </span>
                            {idx < comboChain.length - 1 && (
                              <span className="text-[#94A3B8] font-sans">→</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 4: Model AI Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#F8FAFC]">
              4. Model AI Utama yang Digunakan
            </label>
            {activeConfig.models.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeConfig.models.map((m) => {
                  const isModelSelected = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id);
                        setPreferredModel(m.id);
                        toast.success(`Model disetel ke ${m.name}`);
                      }}
                      className={`p-2.5 rounded-[8px] text-xs text-left border transition-all cursor-pointer ${
                        isModelSelected
                          ? "bg-[#E95420]/15 border-[#E95420] text-[#F8FAFC]"
                          : "bg-[#1C273C] border-[#26334D] text-[#94A3B8] hover:text-[#F8FAFC]"
                      }`}
                    >
                      <div className="font-mono font-medium text-xs text-[#F8FAFC]">{m.name}</div>
                      {m.tag && (
                        <div className="text-[10px] text-[#E95420] mt-0.5 font-medium">{m.tag}</div>
                      )}
                      <div className="text-[10px] text-[#94A3B8] mt-1 line-clamp-1">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <InputApp
                type="text"
                placeholder="Contoh: llama3.2, mistral, custom-model"
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setPreferredModel(e.target.value);
                }}
                className="font-mono text-xs"
              />
            )}
          </div>

          {/* SECTION 5: Base URL (if custom, openrouter, or Ollama) */}
          {(selectedProvider === "ollama" ||
            selectedProvider === "custom" ||
            selectedProvider === "openrouter") && (
            <div className="space-y-2 p-3.5 rounded-[10px] bg-[#0D131F] border border-[#26334D]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#38BDF8]" />
                  5. API Base URL Endpoint
                </label>
                {urlValidation.isValid ? (
                  urlValidation.isLocal ? (
                    <span className="flex items-center gap-1 text-[10px] text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded border border-[#38BDF8]/20">
                      <ShieldCheck className="w-3 h-3" />
                      Lokal Loopback (Ollama)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                      <ShieldCheck className="w-3 h-3" />
                      Terkoneksi Aman (HTTPS)
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded border border-[#EF4444]/20">
                    <AlertCircle className="w-3 h-3" />
                    Format Tidak Aman
                  </span>
                )}
              </div>

              <InputApp
                type="text"
                placeholder={activeConfig.defaultBaseUrl}
                value={baseUrlInput}
                onChange={(e) => {
                  setBaseUrlInput(e.target.value);
                  setApiBaseUrl(e.target.value);
                }}
                className={`font-mono text-xs ${
                  !urlValidation.isValid ? "border-[#EF4444] focus:border-[#EF4444]" : ""
                }`}
              />

              {!urlValidation.isValid ? (
                <div className="text-[11px] text-[#EF4444] flex items-center gap-1.5 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{urlValidation.error}</span>
                </div>
              ) : (
                <div className="text-[10px] text-[#94A3B8] leading-relaxed">
                  Permintaan dikirim langsung dari browser klien (Client-Side). Sesuai kebijakan Content Security Policy (CSP), hanya protokol HTTPS dan localhost (port lokal) yang diizinkan untuk melindungi dari eksfiltrasi data dan serangan SSRF.
                </div>
              )}
            </div>
          )}

          {/* Test Connection Alert Result */}
          {testResult && (
            <div
              className={`p-3.5 rounded-[8px] border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
                testResult.success
                  ? "bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]"
                  : "bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed whitespace-pre-wrap">
                {testResult.message}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#26334D] bg-[#1C273C]/50 flex items-center justify-between">
          <ButtonApp
            type="button"
            intent="secondary"
            disabled={isProcessing}
            onClick={handleTestConnection}
            className="flex items-center gap-2 text-xs cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E95420]" />
                <span>Menguji koneksi...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-[#E95420]" />
                <span>Uji Koneksi API</span>
              </>
            )}
          </ButtonApp>

          <ButtonApp
            type="button"
            intent="primary"
            onClick={onClose}
            className="text-xs px-5 cursor-pointer font-semibold"
          >
            Selesai & Tutup
          </ButtonApp>
        </div>
      </div>
    </div>
  );
}
