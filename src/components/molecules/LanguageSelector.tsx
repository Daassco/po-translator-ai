import { Globe } from "lucide-react";

export interface LocaleOption {
  code: string;
  name: string;
  flag: string;
}

export const COMMON_LOCALES: LocaleOption[] = [
  { code: "auto", name: "Deteksi Otomatis (Auto Detect)", flag: "✨" },
  { code: "id_ID", name: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "en_US", name: "English (United States)", flag: "🇺🇸" },
  { code: "ko_KR", name: "Korean (한국어)", flag: "🇰🇷" },
  { code: "ja_JP", name: "Japanese (日本語)", flag: "🇯🇵" },
  { code: "zh_CN", name: "Chinese Simplified (简体中文)", flag: "🇨🇳" },
  { code: "es_ES", name: "Spanish (Español)", flag: "🇪🇸" },
  { code: "de_DE", name: "German (Deutsch)", flag: "🇩🇪" },
  { code: "fr_FR", name: "French (Français)", flag: "🇫🇷" },
  { code: "pt_BR", name: "Portuguese (Brasil)", flag: "🇧🇷" },
  { code: "ru_RU", name: "Russian (Русский)", flag: "🇷🇺" },
  { code: "ar_SA", name: "Arabic (العربية)", flag: "🇸🇦" },
  { code: "it_IT", name: "Italian (Italiano)", flag: "🇮🇹" },
  { code: "nl_NL", name: "Dutch (Nederlands)", flag: "🇳🇱" },
  { code: "vi_VN", name: "Vietnamese (Tiếng Việt)", flag: "🇻🇳" },
  { code: "th_TH", name: "Thai (ไทย)", flag: "🇹🇭" },
];

interface LanguageSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  label,
  value,
  onChange,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
        <Globe className="w-3.5 h-3.5 text-[#E95420]" />
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full bg-[#1C273C] border border-[#26334D] text-[#F8FAFC] text-sm rounded-[8px] px-3 py-2.5 appearance-none focus:outline-none focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] transition-colors cursor-pointer disabled:opacity-50"
        >
          {COMMON_LOCALES.map((locale) => (
            <option key={locale.code} value={locale.code} className="bg-[#161F30] text-[#F8FAFC]">
              {locale.flag} {locale.name} ({locale.code})
            </option>
          ))}
          {!COMMON_LOCALES.some((l) => l.code === value) && (
            <option value={value} className="bg-[#161F30] text-[#F8FAFC]">
              🌐 Custom: {value}
            </option>
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#94A3B8]">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
