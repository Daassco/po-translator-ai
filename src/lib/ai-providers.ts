export type AiProvider =
  | "gemini"
  | "google_translate"
  | "ollama"
  | "openrouter"
  | "deepseek"
  | "groq"
  | "openai"
  | "custom";

export interface ModelPreset {
  id: string;
  name: string;
  tag?: string;
  desc: string;
}

export interface ProviderDefinition {
  id: AiProvider;
  name: string;
  badge: string;
  defaultBaseUrl: string;
  requiresKey: boolean;
  defaultModel: string;
  keyUrl?: string;
  keyPlaceholder?: string;
  keyHelp?: string;
  description: string;
  models: ModelPreset[];
}

export const PROVIDER_LIST: ProviderDefinition[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "Official",
    defaultBaseUrl: "",
    requiresKey: true,
    defaultModel: "gemini-3.8-flash",
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyPlaceholder: "AIzaSy...",
    keyHelp: "Dapatkan API Key gratis di Google AI Studio.",
    description: "SDK resmi Google AI Studio dengan kecepatan tinggi dan pemahaman Gettext akurat.",
    models: [
      {
        id: "gemini-3.8-flash",
        name: "gemini-3.8-flash",
        tag: "Rekomendasi Resmi ⚡",
        desc: "Kecepatan tertinggi & pemahaman sintaks Gettext PO paling akurat.",
      },
      {
        id: "gemini-3.8-pro",
        name: "gemini-3.8-pro",
        tag: "Flagship 3.8 👑",
        desc: "Penalaran mendalam untuk kalimat sastra kompleks dan istilah teknis spesifik.",
      },
      {
        id: "gemini-2.5-flash",
        name: "gemini-2.5-flash",
        tag: "Generasi 2.5",
        desc: "Alternatif cepat dan stabil untuk alur kerja penerjemahan gettext.",
      },
      {
        id: "gemini-2.5-pro",
        name: "gemini-2.5-pro",
        tag: "Pro 2.5",
        desc: "Kemampuan konteks luas untuk file dokumentasi dan teks panjang.",
      },
    ],
  },
  {
    id: "google_translate",
    name: "Google Translate (Online Bebas Limit)",
    badge: "Bebas Kuota RPD 🚀",
    defaultBaseUrl: "https://translate.googleapis.com",
    requiresKey: false,
    defaultModel: "gtx-neural",
    keyPlaceholder: "Tidak perlu API Key (Gratis & Terbuka)",
    keyHelp: "Menggunakan mesin Google Translate publik dengan Variable & Tag Masking otomatis untuk menjaga variabel Gettext.",
    description: "Penerjemah online cepat tanpa kuota harian (bebas error 429 RPD). Dilengkapi proteksi tag & variabel %s, {name}.",
    models: [
      {
        id: "gtx-neural",
        name: "Google Neural Translate",
        tag: "Bebas Limit ⚡",
        desc: "Mesin neural translate cepat, stabil, dan tanpa batas kuota harian 20 RPD.",
      },
    ],
  },
  {
    id: "ollama",
    name: "Ollama (Lokal / Bebas Biaya)",
    badge: "100% Offline & Gratis",
    defaultBaseUrl: "http://localhost:11434/v1",
    requiresKey: false,
    defaultModel: "llama3.2",
    keyPlaceholder: "Tidak perlu API Key (Ollama lokal)",
    keyHelp: "Pastikan 'ollama serve' aktif. 100% privat di komputer Anda tanpa kirim data ke cloud.",
    description: "Jalankan model AI open-source langsung di PC Anda. Tanpa biaya, tanpa kuota, 100% offline.",
    models: [
      {
        id: "llama3.2",
        name: "llama3.2",
        tag: "Ringan & Cepat",
        desc: "Ideal untuk laptop dan PC standar tanpa membebani GPU.",
      },
      {
        id: "qwen2.5-coder",
        name: "qwen2.5-coder",
        tag: "Presisi Tinggi 🎯",
        desc: "Sangat unggul menjaga placeholder %s, {name}, dan tag Gettext.",
      },
      {
        id: "deepseek-r1",
        name: "deepseek-r1",
        tag: "Penalaran Canggih",
        desc: "Model reasoning open-source mutakhir dari DeepSeek.",
      },
      {
        id: "mistral",
        name: "mistral",
        tag: "Multibahasa Klasik",
        desc: "Dikenal stabil untuk terjemahan ragam bahasa Eropa dan Asia.",
      },
      {
        id: "gemma2",
        name: "gemma2",
        tag: "Google Open Weight",
        desc: "Model open weight dari Google dengan diksi natural.",
      },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter (Claude, GPT, Qwen)",
    badge: "Multi-Model Cloud",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    requiresKey: true,
    defaultModel: "anthropic/claude-3.5-sonnet",
    keyUrl: "https://openrouter.ai/keys",
    keyPlaceholder: "sk-or-v1-...",
    keyHelp: "Satu API Key untuk mengakses Claude 3.5 Sonnet, GPT-4o, Qwen 2.5, DeepSeek, dll.",
    description: "Gateway agregator AI universal. Pilih Claude Sonnet, GPT-4o, atau Qwen hanya dengan satu akun.",
    models: [
      {
        id: "anthropic/claude-3.5-sonnet",
        name: "claude-3.5-sonnet",
        tag: "Diksi Halus 🎭",
        desc: "Terjemahan sastra dan UI paling natural dengan nuansa kontekstual terbaik.",
      },
      {
        id: "openai/gpt-4o",
        name: "gpt-4o",
        tag: "Flagship OpenAI",
        desc: "Kecerdasan tingkat tinggi dan presisi instruksi format Gettext.",
      },
      {
        id: "deepseek/deepseek-chat",
        name: "deepseek-chat",
        tag: "Super Hemat",
        desc: "DeepSeek-V3 dengan performa setara frontier model dengan biaya minim.",
      },
      {
        id: "qwen/qwen-2.5-72b-instruct",
        name: "qwen-2.5-72b",
        tag: "Multibahasa Global",
        desc: "Model open-source terkuat di dunia untuk translasi multibahasa.",
      },
      {
        id: "meta-llama/llama-3.3-70b-instruct",
        name: "llama-3.3-70b",
        tag: "Meta Open Flagship",
        desc: "Generasi terbaru Llama 3.3 dengan penalaran tajam.",
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek Official",
    badge: "Official Endpoint",
    defaultBaseUrl: "https://api.deepseek.com",
    requiresKey: true,
    defaultModel: "deepseek-chat",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyPlaceholder: "sk-...",
    keyHelp: "Dapatkan API Key di platform.deepseek.com.",
    description: "Infrastruktur resmi DeepSeek untuk terjemahan berkecepatan tinggi dengan biaya sangat terjangkau.",
    models: [
      {
        id: "deepseek-chat",
        name: "deepseek-chat (V3)",
        tag: "Rekomendasi DeepSeek ⚡",
        desc: "Model V3 berkapasitas 671B MoE, sangat cepat dan hemat biaya.",
      },
      {
        id: "deepseek-reasoner",
        name: "deepseek-reasoner (R1)",
        tag: "Reasoning R1 🧠",
        desc: "Penalaran mendalam untuk kalimat idiomatik dan gettext teknis sulit.",
      },
    ],
  },
  {
    id: "groq",
    name: "Groq (Kecepatan Ekstrem)",
    badge: "LPU Ultra Cepat",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    requiresKey: true,
    defaultModel: "llama-3.3-70b-versatile",
    keyUrl: "https://console.groq.com/keys",
    keyPlaceholder: "gsk_...",
    keyHelp: "Dapatkan API Key di console.groq.com.",
    description: "Hardware akselerator Groq LPU menghadirkan inferensi super cepat hingga 500+ token per detik.",
    models: [
      {
        id: "llama-3.3-70b-versatile",
        name: "llama-3.3-70b",
        tag: "Kecepatan Ekstrem ⚡",
        desc: "Model Llama 3.3 70B dengan inferensi kilat bebas hambatan.",
      },
      {
        id: "mixtral-8x7b-32768",
        name: "mixtral-8x7b",
        tag: "Konteks 32k",
        desc: "Model Mixture-of-Experts cepat dan stabil.",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI Official",
    badge: "Official Endpoint",
    defaultBaseUrl: "https://api.openai.com/v1",
    requiresKey: true,
    defaultModel: "gpt-4o-mini",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-proj-...",
    keyHelp: "Dapatkan API Key di platform.openai.com.",
    description: "Akses resmi ke API OpenAI untuk model GPT-4o dan model reasoning.",
    models: [
      {
        id: "gpt-4o-mini",
        name: "gpt-4o-mini",
        tag: "Cepat & Hemat",
        desc: "Model ringan OpenAI yang cerdas dan efisien untuk batch translasi.",
      },
      {
        id: "gpt-4o",
        name: "gpt-4o",
        tag: "Flagship",
        desc: "Model frontier dengan kepatuhan format dan tata bahasa tingkat tinggi.",
      },
      {
        id: "o3-mini",
        name: "o3-mini",
        tag: "Reasoning",
        desc: "Model penalaran logika terfokus untuk string teknis rumit.",
      },
    ],
  },
  {
    id: "custom",
    name: "Custom OpenAI Endpoint",
    badge: "Fleksibel",
    defaultBaseUrl: "http://localhost:1234/v1",
    requiresKey: false,
    defaultModel: "custom-model",
    keyPlaceholder: "Opsional jika endpoint lokal tidak memerlukan auth...",
    keyHelp: "Gunakan untuk LM Studio, vLLM, Text Generation WebUI, LocalAI, atau reverse proxy.",
    description: "Hubungkan ke server LLM apa pun yang kompatibel dengan protokol REST OpenAI /chat/completions.",
    models: [],
  },
];

export function getProviderConfig(provider: AiProvider): ProviderDefinition {
  const found = PROVIDER_LIST.find((p) => p.id === provider);
  return found || PROVIDER_LIST[0];
}
