import * as React from "react";
import { BookOpen, Server, Shield, ExternalLink, Copy, Check, ShieldCheck, Lock, Cpu, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function DocsViewer({ defaultTab = "user-guide" }: { defaultTab?: "user-guide" | "security" | "prompt-guard" | "self-hosting" }) {
  const [activeTab, setActiveTab] = React.useState<"user-guide" | "security" | "prompt-guard" | "self-hosting">(defaultTab);
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const copySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Snippet disalin ke clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="bg-[#161F30] border border-[#26334D] rounded-[12px] overflow-hidden">
      {/* Tabs Header */}
      <div className="flex items-center gap-1 p-2 bg-[#1C273C] border-b border-[#26334D] overflow-x-auto">
        <button
          onClick={() => setActiveTab("user-guide")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[6px] text-xs font-medium transition-all ${
            activeTab === "user-guide"
              ? "bg-[#E95420] text-white"
              : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#161F30]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Panduan Pengguna (User Guide)</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[6px] text-xs font-medium transition-all ${
            activeTab === "security"
              ? "bg-[#E95420] text-white"
              : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#161F30]"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Keamanan & Privasi Data</span>
        </button>

        <button
          onClick={() => setActiveTab("prompt-guard")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[6px] text-xs font-medium transition-all ${
            activeTab === "prompt-guard"
              ? "bg-[#E95420] text-white"
              : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#161F30]"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Dokumentasi Parser & AI Guard</span>
        </button>

        <button
          onClick={() => setActiveTab("self-hosting")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[6px] text-xs font-medium transition-all ${
            activeTab === "self-hosting"
              ? "bg-[#E95420] text-white"
              : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#161F30]"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Arsitektur & Self-Hosting</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6 text-xs text-[#94A3B8] leading-relaxed space-y-6">
        {activeTab === "user-guide" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] mb-2 flex items-center gap-2">
                1. Cara Mendapatkan Google Gemini API Key Gratis (BYOK)
              </h3>
              <p>
                Aplikasi ini menggunakan model BYOK (<em>Bring Your Own Key</em>) agar Anda dapat menikmati kuota penerjemahan gratis langsung dari Google tanpa biaya langganan:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 mt-2 ml-1 text-[#F8FAFC]/90">
                <li>Buka situs <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[#E95420] hover:underline font-mono inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3" /></a></li>
                <li>Masuk menggunakan akun Google Anda lalu klik tombol <strong>"Create API Key"</strong>.</li>
                <li>Salin kunci yang diawali dengan <code>AIzaSy...</code></li>
                <li>Klik tombol <strong>Gemini API Key</strong> di header aplikasi ini dan tempel kunci Anda.</li>
              </ol>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] mb-2">
                2. Alur Penerjemahan File GNU Gettext (.po)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#1C273C] p-3.5 rounded-[8px] border border-[#26334D]">
                  <div className="font-semibold text-[#E95420] mb-1">Langkah 1: Unggah</div>
                  <div>Tarik file <code>.po</code> atau <code>.pot</code> ke dalam dropzone. Header dan entri teks akan langsung diurai di browser secara instan.</div>
                </div>
                <div className="bg-[#1C273C] p-3.5 rounded-[8px] border border-[#26334D]">
                  <div className="font-semibold text-[#E95420] mb-1">Langkah 2: Terjemah AI</div>
                  <div>Pilih bahasa target, lalu klik <strong>"Terjemah Otomatis"</strong>. AI memproses per batch dengan penjagaan ketat pada tag HTML dan variabel.</div>
                </div>
                <div className="bg-[#1C273C] p-3.5 rounded-[8px] border border-[#26334D]">
                  <div className="font-semibold text-[#E95420] mb-1">Langkah 3: Unduh .PO</div>
                  <div>Tinjau hasil di editor dua kolom, lalu unduh file <code>.po</code> terkompilasi yang siap dipakai di Poedit atau WordPress.</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] mb-2">
                3. Konsistensi Terminologi dengan Glosarium
              </h3>
              <p>
                Sebelum menjalankan terjemahan otomatis, buka menu <strong>Glosarium</strong> untuk menetapkan terjemahan standar (misal: <em>Commit</em> → <em>Komit</em>) atau menandai istilah <strong>Do Not Translate (DNT)</strong> agar merek dagang atau nama variabel tidak disentuh oleh AI.
              </p>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                Arsitektur Privasi Data & Keamanan Lokal (Zero-Knowledge)
              </h3>
              <p>
                Dalam proyek open-source publik, kredensial pengguna tidak boleh disimpan di server terpusat. Aplikasi ini menerapkan perlindungan data ketat langsung di browser Anda:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#1C273C] rounded-[8px] border border-[#26334D] space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#10B981]">
                  <Lock className="w-4 h-4" />
                  <span>Enkripsi Sisi Klien</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  API Key dienkripsi secara lokal sebelum disimpan ke browser. Kunci Anda tidak pernah dikirim ke database atau server pengembang aplikasi.
                </p>
              </div>

              <div className="p-4 bg-[#1C273C] rounded-[8px] border border-[#26334D] space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#E95420]">
                  <Cpu className="w-4 h-4" />
                  <span>Perlindungan PIN Rahasia</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Kunci hanya dapat dibuka menggunakan PIN master pribadi yang Anda tentukan sendiri. Tanpa verifikasi PIN yang tepat, brankas data tidak dapat diakses.
                </p>
              </div>

              <div className="p-4 bg-[#1C273C] rounded-[8px] border border-[#26334D] space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#38BDF8]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Isolasi Memori Sesi (Anti-Leak)</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Kunci asli tidak pernah ditulis dalam bentuk teks biasa di penyimpanan permanen peramban. Kunci hanya tersimpan sementara di memori selama sesi aktif dan otomatis terhapus saat tab ditutup.
                </p>
              </div>

              <div className="p-4 bg-[#1C273C] rounded-[8px] border border-[#26334D] space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#F59E0B]">
                  <EyeOff className="w-4 h-4" />
                  <span>Penyamaran Tampilan (UI Masking)</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Kunci selalu disamarkan di antarmuka (<code>••••••••</code>) untuk mencegah orang lain melihat kredensial Anda dari layar monitor.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "self-hosting" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] mb-2 flex items-center gap-2">
                Deploy Mandiri (Zero-Friction Self-Hosting)
              </h3>
              <p>
                Proyek ini adalah 100% open-source berlisensi MIT. Anda dapat men-deploy aplikasi ini ke Vercel, Netlify, Cloudflare Pages, atau server Docker milik sendiri.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#F8FAFC]">
                <span>1. Clone & Jalankan Lokal:</span>
                <button
                  onClick={() => copySnippet("git clone https://github.com/your-username/po-translator-ai.git\ncd po-translator-ai\nnpm install\nnpm run dev", "clone")}
                  className="text-[#E95420] hover:text-[#D04616] flex items-center gap-1"
                >
                  {copiedCode === "clone" ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Salin Command</span>
                </button>
              </div>
              <pre className="bg-[#0D131F] p-3.5 rounded-[8px] border border-[#26334D] font-mono text-[11px] text-[#F8FAFC] overflow-x-auto">
{`git clone https://github.com/your-username/po-translator-ai.git
cd po-translator-ai
npm install
npm run dev`}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#F8FAFC]">
                <span>2. Menghubungkan Supabase Database (Opsional):</span>
              </div>
              <p>
                Jalankan file migrasi yang tersedia di <code>supabase/migrations/20261111082700_init_po_translator.sql</code> di SQL Editor Supabase Anda, lalu atur environment variables di <code>.env.local</code>:
              </p>
              <pre className="bg-[#0D131F] p-3.5 rounded-[8px] border border-[#26334D] font-mono text-[11px] text-[#38BDF8] overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxx...`}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "prompt-guard" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] mb-2 flex items-center gap-2">
                Proteksi Placeholder & Sintaks Gettext
              </h3>
              <p>
                Banyak penerjemah AI konvensional sering merusak variabel seperti <code>%s</code> menjadi <code>% s</code> atau menerjemahkan tag HTML. Penerjemah PO AI menggunakan arsitektur dual-layer:
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#1C273C] rounded-[8px] border border-[#26334D]">
                <div className="font-semibold text-[#10B981] mb-1">Layer 1: Gemini Structured Output (JSON Schema)</div>
                <div>Request diterjemahkan dalam batch array dengan respons skema terstruktur <code>Type.ARRAY</code> berisi objek <code>{`{ index, msgstr }`}</code>, menjamin format selalu valid dan tidak menyisipkan narasi pembuka/penutup.</div>
              </div>

              <div className="p-3 bg-[#1C273C] rounded-[8px] border border-[#26334D]">
                <div className="font-semibold text-[#E95420] mb-1">Layer 2: Client-side Regex Integrity Guard</div>
                <div>Setelah terjemahan diterima, parser secara otomatis memverifikasi kecocokan seluruh variabel printf (<code>%s, %d, %1$s</code>), kurung kurawal (<code>{`{name}`}</code>), dan tag HTML. Jika ada variabel yang terhapus atau tertukar, tabel editor langsung menampilkan tanda peringatan visual.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
