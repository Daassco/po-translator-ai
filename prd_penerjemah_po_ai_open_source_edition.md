# Product Requirements Document (PRD): Penerjemah PO AI (Open-Source Edition)

| Informasi Dokumen | Detail Spesifikasi |
| :--- | :--- |
| **Nama Proyek** | Penerjemah PO AI (*AI-Powered Gettext `.po` Translator & Security Hardened*) |
| **Edisi Dokumen** | Open-Source Edition (Enterprise Security, Multi-Engine & Localization Guard) |
| **Lisensi Proyek** | MIT License (Open Source) |
| **Frontend Stack** | React 18+ (Vite, TypeScript) + Tailwind CSS |
| **Backend & Database** | Supabase (PostgreSQL, Auth, Row Level Security, RFC 4122 UUID) |
| **AI & Translation Engines** | Google Gemini (`@google/genai`), Google Translate Online, OpenAI-Compatible (Ollama, OpenRouter, DeepSeek, Groq, Custom) |
| **Keamanan & Perlindungan** | Web Crypto API AES-GCM 256-bit + PIN Master, Strict CSP (Anti-XSS), Sanitasi Input, Rate Limiter Anti-Spam |
| **Mode Penggunaan & Ketahanan** | Crypto Vault Terenkripsi, Fitur Combo Auto-Failover Model AI, & Guest Mode Seamless |

---

## 1. Visi & Ringkasan Produk (Product Overview)
**Penerjemah PO AI** adalah platform web *open-source* berbasis multi-model kecerdasan buatan (*Multi-Engine AI*) yang dirancang untuk membantu *software developer*, *localization engineer*, dan kontributor komunitas melokalkan file GNU Gettext (`.po`) secara cepat, presisi, aman, dan kontekstual.

Berbeda dengan alat penerjemah konvensional yang kerap merusak sintaks kode atau menerjemahkan variabel secara serampangan, aplikasi ini mengintegrasikan **arsitektur multi-model yang fleksibel**:
1. **Model AI Canggih (Google Gemini & OpenAI-Compatible):** Mendukung Google Gemini (dengan *Structured Outputs* JSON ketat), model lokal *self-hosted* yang privat melalui Ollama, serta penyedia LLM cloud terkemuka seperti DeepSeek, OpenRouter, Groq, dan OpenAI.
2. **Mesin Penerjemah Cepat Tanpa Kuota (Google Translate Online):** Opsi instan bebas batas kuota 20 RPD yang dilengkapi proteksi *token masking* pra-terjemahan dan *auto-healing* pasca-terjemahan.
3. **Pipeline Proteksi Variabel & Kode Error Berlapis:** Menjamin variabel *placeholder* (`%s`, `%1$d`, `{name}`, `{0}`), tag HTML/XML, kode identifikasi teknis (`[... : CODE]`), dan partikel bahasa (seperti helper partikel Korea `|hpp`) tetap utuh dan tidak mengalami halusinasi terjemahan.

Karena bersifat *open-source*, aplikasi ini mengadopsi model **BYOK (*Bring Your Own Key*)** terdesentralisasi yang diperkuat **Client-Side Crypto Vault** berstandar enkripsi AES-GCM 256-bit berproteksi PIN lokal, memastikan tidak ada kunci API *plaintext* yang tersimpan atau bocor ke server pihak ketiga. Seluruh alur kerja ini terintegrasi dalam **Dashboard Terpadu All-in-One** yang memuat ruang kerja editor, riwayat terjemahan, glosarium istilah DNT (*Do Not Translate*), dokumentasi internal, dan apresiasi kontributor komunitas GitHub.

---

## 2. Target Pengguna (User Personas)
1. **Open-Source Maintainer & Developer:** Membutuhkan alat cepat untuk melokalkan aplikasi/plugin (WordPress, Laravel, React, Python, dll.) ke berbagai bahasa tanpa merusak *syntax*.
2. **Localization Translator:** Membutuhkan antarmuka editor dua kolom yang nyaman dengan fitur *Glossary* agar terjemahan istilah teknis tetap konsisten.
3. **Open-Source Contributor:** Developer yang ingin ikut mengembangkan fitur baru, memperbaiki *bug* parser, atau menyempurnakan *prompt* AI melalui repositori GitHub proyek.

---

## 3. Arsitektur & Tumpukan Teknologi (Tech Stack Architecture)

Aplikasi dibangun menggunakan ekosistem web modern berbasis *TypeScript-First* dengan performa kompilasi instan dan arsitektur keamanan *client-side zero-knowledge*:

### 3.1. Tabel Rincian Teknologi (Master Tech Stack Table)

| Lapisan / Kategori | Teknologi & Pustaka | Versi | Peran & Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **Bahasa Pemrograman** | **TypeScript** | `v5.7+` | *Strict Type-Safety*, kontrak antarmuka (*Interface*) data Gettext, eliminasi error *undefined/null* pada saat kompilasi. |
| **Runtime & Modul** | **JavaScript (ESM)** | `ES2022+` | Standar modularitas modern peramban web (*ECMAScript Modules*) tanpa *bundling overhead*. |
| **Frontend Framework** | **React** | `v18.3+` | Deklaratif, isolasi rendering DOM anti-XSS (`textContent`), ekosistem komponen yang matang. |
| **Build Tool & Bundler**| **Vite** | `v6.2+` | *Next-Generation Frontend Tooling*, *Lightning Fast Hot Module Replacement* (HMR), dan kompilasi Rollup teroptimasi. |
| **Routing & Navigasi** | **React Router** | `v7.3+` | Manajemen rute *Single Page Application* (SPA), tata letak bersarang (*Nested Layouts*), dan *Outlet context*. |
| **State Management** | **Zustand** | `v5.0+` | Manajemen *state* terpusat yang sangat ringan, *middleware persist*, dan isolasi sesi memori RAM (*zero-leak*). |
| **CSS Framework** | **Tailwind CSS** | `v4.0+` | *Utility-First CSS*, integrasi `@tailwindcss/vite`, tema *Dark Mode First*, dan performa render tanpa CSS *runtime*. |
| **Komponen UI Primitives**| **Radix UI** | `v1.2 - v2.2` | Komponen primitif tanpa gaya (*headless*) yang memenuhi standar aksesibilitas web WAI-ARIA (Dialog, Tooltip, Progress, Tabs, Dropdown). |
| **Desain Varian Komponen**| **Class Variance Authority (CVA)** | `v0.7+` | Pengelolaan varian gaya komponen atomik berbasis TypeScript yang aman dari konflik CSS (*type-safe component variants*). |
| **Utilitas Styling** | **clsx & tailwind-merge** | `v2.1+ / v3.0+`| Penggabungan kelas Tailwind dinamis tanpa duplikasi atau bentrokan spesifisitas (*conflict-free class merging*). |
| **Ikonografi** | **Lucide React** | `v1.16+` | Set ikon SVG vektor yang konsisten, modern, tajam, dan mendukung pohon guncang (*tree-shakable*). |
| **Notifikasi Toast** | **Sonner** | `v2.0+` | Pustaka notifikasi mengambang (*toast*) yang elegan, interaktif, dapat ditumpuk (*stackable*), dan ramah aksesibilitas. |
| **Data Fetching & Cache**| **TanStack React Query** | `v5.67+` | Pengelolaan sinkronisasi data asinkron server, pembaruan latar belakang, dan *caching* status. |
| **BaaS & Basis Data** | **Supabase (`@supabase/supabase-js`)** | `v2.49+` | Platform PostgreSQL terkelola, GoTrue Auth (OAuth GitHub/Google), Row Level Security (RLS), dan `pgcrypto` UUID. |
| **AI Native SDK** | **Google GenAI SDK (`@google/genai`)** | `v3.1+` | Integrasi resmi Google Gemini dengan *Structured Outputs* (skema JSON ketat) dan kontrol inferensi deterministik. |
| **AI Universal Protocol**| **OpenAI Compatible Protocol** | Standard | Protokol universal `/chat/completions` untuk menghubungkan model lokal (Ollama) dan cloud (OpenRouter, DeepSeek, Groq, OpenAI). |
| **Mesin Terjemahan Web**| **Google Translate Web Engine** | Custom GTX | Panggilan HTTP GET (CORS Simple Request) via endpoint web GTX dengan proteksi *sentence chunking* dan *token masking*. |
| **Kriptografi Klien** | **Web Crypto API (`SubtleCrypto`)** | Browser Native | Enkripsi tingkat militer AES-GCM 256-bit dan derivasi kunci PBKDF2 (100.000 iterasi SHA-256) terproteksi PIN lokal. |
| **Keamanan Peramban** | **Content Security Policy (CSP)** | W3C Standard | Meta tag ketat pembatas `connect-src`, `object-src 'none'`, dan `base-uri 'self'` untuk pertahanan anti-XSS mutlak. |
| **Validator URL Keamanan**| **URL Security Validator** | In-House | Modul anti-SSRF untuk memblokir IP metadata cloud (`169.254.169.254`), port non-HTTP sensitif, dan sanitasi kredensial. |
| **Anti-Spam & Throttle**| **Sliding Window Rate Limiter** | In-House | Pembatasan frekuensi klik tombol (*action cooldown*), batasan RPM provider, dan proteksi anti brute-force PIN. |
| **Parser GNU Gettext** | **Client-Side PO Parser Engine** | In-House | Pengurai dan perakit format file `.po` murni di peramban tanpa pengiriman file mentah ke server luar. |
| **Audit Keamanan API** | **Strix Security Skills** | `v1.0` | Panduan audit otomatis kepatuhan standar OWASP API Security Top 10 (2023). |
| **Integrasi Komunitas** | **GitHub REST API** | `v3` | Pengambilan real-time profil kontributor, jumlah *stars*, *forks*, dan statistik repositori publik. |

### 3.2. Sorotan Arsitektur Teknis:
1. **TypeScript-First & Type-Safe Contract:** Seluruh objek data Gettext (`PoEntry`, `PoHeader`), konfigurasi penyedia AI (`AiProvider`, `ProviderConfig`), dan hasil validasi placeholder memiliki pengetikan ketat (*strict typing*), mengeliminasi potensi *type mismatch* pada waktu eksekusi.
2. **Kompilasi Cepat dengan Vite 6:** Memanfaatkan *native ES modules* untuk waktu *cold-start* instan (< 300ms) dan pembaruan HMR < 50ms saat proses pengembangan.
3. **Pemisahan Memori RAM & Penyimpanan Lokal (Zero Plaintext Exposure):** Kunci API *plaintext* hanya berada di RAM saat *vault* dibuka dan otomatis hilang saat halaman dimuat ulang. Hanya *ciphertext* AES-GCM yang diizinkan menetap di `localStorage` atau Supabase.
4. **Resiliensi Multi-Mesin & Auto-Failover:** Mendukung perutean pintar antara model AI canggih (dengan failover otomatis rantai *Combo*) dan mesin Google Translate bebas batas kuota harian.

---

## 4. Peta Jalan & Kebutuhan Fungsional (Functional Requirements)

Pengembangan dibagi menjadi 5 Fase terstruktur:

### Fase 1: Terjemah PO (Core Engine, Multi-Engine & Localization Guard)
Fokus pada alur kerja utama penerjemahan yang dapat langsung digunakan bahkan tanpa login (*Guest Mode*).
1. **Konfigurasi Penyedia Terjemahan & Crypto Vault (BYOK):**
   * Dukungan multi-penyedia: Gemini API, Google Translate Online, Ollama, OpenRouter, DeepSeek, Groq, dan Custom Endpoint.
   * **Crypto Vault Terproteksi PIN:** Kunci API disimpan dalam bentuk *ciphertext* AES-GCM 256-bit di `localStorage` atau Supabase. Kunci *plaintext* hanya berada di RAM saat *vault* dibuka dan otomatis dihapus saat sesi dikunci/halaman di-reload.
   * **Proteksi Brute-Force PIN:** Maksimal 5x percobaan PIN yang salah memicu penguncian keamanan (*cooldown*) selama 30 detik.
   * Fitur **"Tes Koneksi API"** yang dilengkapi *rate limiting* (cooldown 2 detik antar pengujian).
2. **Fitur Combo Model AI (Auto-Failover saat Limit / Kuota Habis):**
   * **Khusus Model AI (Gemini & OpenAI-Compatible):** Berbeda dengan Google Translate Online yang beroperasi tanpa kuota atau API key, model AI memiliki limit kuota harian dan batasan request per menit (RPM).
   * **Deteksi Otomatis HTTP 429 & Resource Exhausted:** Jika model AI yang aktif mengalami penolakan kuota, sistem mendeteksi error limit secara instan.
   * **Peralihan Rantai Model Mulus (*Seamless Model Failover*):** Mesin secara otomatis mengalihkan permintaan ke model cadangan berikutnya dalam rantai combo (`gemini-3.8-flash` → `gemini-2.5-flash` → `gemini-3.8-pro` → `gemini-2.5-pro`), menampilkan notifikasi toast peringatan, memperbarui state preferensi model, dan langsung mengulang batch terjemahan tanpa kegagalan.
   * **Kontrol Pengguna:** Pengguna dapat mengaktifkan atau menonaktifkan fitur Combo ini kapan saja melalui modal pengaturan model.
3. **Unggah File PO:**
   * Komponen *Drag-and-Drop* untuk file berekstensi `.po` (maksimal 15 MB).
   * Validasi struktur file dan ekstraksi otomatis metadata header (`Project-Id-Version`, `Language`, `Plural-Forms`) serta daftar pasangan `msgid` dan `msgstr`.
4. **Pilih Bahasa:**
   * *Dropdown* pencarian Bahasa Sumber (otomatis terdeteksi dari konten file `.po`) dan Bahasa Target (lengkap dengan kode lokal standar seperti `id_ID`, `ja_JP`, `es_ES`).
5. **Terjemah Otomatis (Batch Processing dengan Pilihan Batas Baris):**
   * **Pilihan Batas Baris Fleksibel:** Pengguna dapat memilih batas terjemahan: **100 baris**, **200 baris**, atau **500 baris** per sesi terjemahan. Tombol dan kuota batch tersinkronisasi secara dinamis.
   * **Terjemah Baris Tunggal (*Single-Row Instant Translate*):** Tombol terjemah langsung per baris pada tabel editor dengan pembatasan *cooldown* 1,2 detik untuk mencegah spam klik.
   * Indikator progres *real-time*, estimasi waktu selesai, dan tombol *Pause/Cancel*.
6. **Editor & Pratinjau Interaktif dengan Guard Validasi:**
   * Tabel editor dua kolom (`msgid` Asli vs `msgstr` Terjemahan) dengan fitur pencarian string, filter (*Semua*, *Belum Diterjemahkan*, *Selesai*, *Fuzzy*).
   * **Filter Peringatan Khusus (*Warning Filter*):** Otomatis mendeteksi dan mengelompokkan baris yang mengalami:
     * Variabel hilang (*missing variables*)
     * Variabel tidak dikenal (*extra variables*)
     * Residu partikel tata bahasa Korea yang rusak (seperti `|hpp` atau `(Lee, Ga)`)
     * Kode error yang tidak sengaja terindonesiakan (misal `PURPLE` menjadi `UNGU`)

### Fase 2: Unduh Hasil & Riwayat Terjemahan
Fokus pada pengelolaan *output* file dan penyimpanan sesi kerja.
1. **Modul Unduh Hasil:**
   * **Unduh File PO:** Mengompilasi ulang JSON ke format `.po` standar yang siap dikompilasi ke `.mo`, lengkap dengan pembaruan `PO-Revision-Date`.
   * **Atur Nama File:** Fitur ubah nama file sebelum diunduh dengan saran otomatis (misal: `messages-id_ID.po`).
   * **Salin Teks:** Tombol *one-click copy* untuk menyalin seluruh teks mentah `.po` ke *clipboard*.
2. **Modul Riwayat Terjemahan:**
   * **Daftar Riwayat:** Menampilkan riwayat file yang pernah dikerjakan (tersimpan di `localStorage` untuk *Guest* dan di tabel `translation_histories` Supabase untuk pengguna yang login).
   * **Cari Riwayat:** Pencarian berdasarkan nama file, kode bahasa, atau tanggal pengerjaan.
   * **Buka Ulang Hasil:** Memuat kembali sesi terjemahan lama ke dalam editor tanpa perlu menggunakan kuota API lagi.
   * **Hapus & Ekspor Riwayat:** Menghapus item riwayat atau mengekspor cadangan proyek dalam format JSON.

### Fase 3: Dashboard Terpadu (All-in-One Open-Source Hub)
1. **Ringkasan Aktivitas & Status Terjemahan:**
   * Kartu metrik: Total File Diterjemahkan, Total Baris Selesai, Penyedia Aktif, dan Persentase Kelengkapan Proyek.
   * Pemantauan status antrean batch dan *error log* API secara real-time.
2. **Akses Cepat (Quick Actions):**
   * Pintasan satu klik untuk: *"Unggah File .PO Baru"*, *"Lanjutkan Proyek Terakhir"*, *"Kelola Crypto Vault"*, dan *"Tambah Istilah Glosarium"*.
3. **Pusat Dokumentasi (Embedded Documentation Hub):**
   * Panduan pengguna, panduan self-hosting, penjelasan arsitektur keamanan Crypto Vault, dan dokumentasi proteksi variabel.
4. **Halaman Kontributor & Komunitas (Contributors & Open-Source Hub):**
   * Hall of Fame kontributor GitHub, metrik repositori (Stars, Forks, Issues), dan pedoman kontribusi (`CONTRIBUTING.md`).

### Fase 4: Login Akun & Sinkronisasi Cloud (Supabase Auth & RLS)
1. **Autentikasi Aman:**
   * Mendukung GitHub OAuth, Google OAuth, serta email/password via Supabase Auth.
2. **Sinkronisasi Otomatis Pengaturan Pengguna (`public.user_settings`):**
   * Sinkronisasi model pilihan (`preferred_model`), target bahasa (`default_target_lang`), dan *ciphertext* Crypto Vault.
   * **Zero Plaintext Wire/Storage:** Kunci API hanya disinkronkan dalam bentuk *ciphertext* AES-GCM; database Supabase tidak pernah mengetahui plaintext kunci API pengguna.
3. **Pemisahan Data Multi-Tenant (RLS):**
   * Kebijakan Row Level Security memastikan pengguna hanya dapat membaca, mengubah, dan menghapus data miliknya sendiri (`auth.uid() = user_id`).

### Fase 5: Glosarium Istilah (Konsistensi Konteks AI & Do Not Translate)
1. **Simpan & Kelola Istilah:**
   * Menambahkan pasangan kata (`Source Term` $\rightarrow$ `Target Term`) atau menandai istilah sebagai **Do Not Translate (DNT)**.
   * CRUD penuh dengan penyimpanan lokal untuk Guest dan sinkronisasi real-time ke tabel `public.glossaries` Supabase (menggunakan UUID RFC 4122).
2. **Impor/Ekspor Glosarium:**
   * Format JSON/CSV untuk berbagi kamus istilah antar komunitas open-source.
3. **Injeksi Glosarium Otomatis:**
   * Glosarium aktif otomatis disuntikkan ke prompt AI maupun proses pasca-terjemahan Google Translate.

---

## 5. Arsitektur Navigasi & Tata Letak Dashboard (UI Wireframe Concept)

Aplikasi mengadopsi tata letak dua kolom modern (*Two-Column Application Frame*) di mana **Sidebar dan Header dikunci secara statis (*Fixed / Pinned*)**, sementara hanya area konten kerja utama yang memiliki scrollbar independen (*Independent Scroll*):

```text
+---------------------------------------------------------------------------------------------------+
| [Logo] Penerjemah PO AI          [Model Aktif: Gemini (Flash) (Combo)] [GitHub: 1.2k Stars] [Akun]|
+---------------------+-----------------------------------------------------------------------------+
| SIDEBAR STATIS      | AREA KONTEN UTAMA (INDEPENDENT SCROLL WORKSPACE)                            |
| (240px Fixed/Sticky)|                                                                             |
|                     | [Tab 1: Ringkasan & Aktivitas] [Tab 2: Dokumentasi]                         |
| > Dashboard         | [Tab 3: Kontributor & Komunitas]                                            |
|                     | --------------------------------------------------------------------------- |
| > Terjemah PO       | [Metrik 1: 14 File] [Metrik 2: 4.250 String] [Status: Idle / Terhubung]     |
|                     |                                                                             |
| > Riwayat [14]      | +-----------------------------+ +-----------------------------------------+ |
|                     | | AKSES CEPAT                 | | STATUS & RIWAYAT TERAKHIR               | |
| > Glosarium [32]    | | [ + Unggah File .PO Baru ]  | | 1. wp-admin-id_ID.po (100% Selesai)     | |
|                     | | [ Model & Kunci API (Vault)]| | 2. laravel-validation (80% Diterjemahkan)| |
| ------------------- | +-----------------------------+ +-----------------------------------------+ |
| [PINNED BOTTOM]     |                                                                             |
| [Kunci API & PIN]   | +-------------------------------------------------------------------------+ |
| [GitHub: 1.2k Stars]| | DOKUMENTASI CEPAT & KONTRIBUTOR PROYEK                                  | |
|                     | | - Cara Kerja Proteksi Variabel (%s, {name}, [Kode : PURPLE])            | |
|                     | | - Top Contributors: [@kontributor-1] [@kontributor-2] [+ Ikut Serta]    | |
|                     | +-------------------------------------------------------------------------+ |
+---------------------+-----------------------------------------------------------------------------+
```

### 5.1. Spesifikasi Perilaku & Komponen Antarmuka:
1. **Sidebar Navigasi Statis (Fixed Left Rail - 240px):**
   * **Posisi Kunci (*Non-Scrolling*):** Ketinggian layar penuh (`h-screen sticky top-0`) dengan kontainer terisolasi dari pergerakan scroll halaman.
   * **Daftar Menu:** Terdiri dari 4 menu utama: **Dashboard**, **Terjemah PO**, **Riwayat**, dan **Glosarium**. Tidak menggunakan badge versi AI kaku pada menu.
   * **Peniadaan Menu Pengaturan Akun:** Tidak terdapat menu "Pengaturan Akun" terpisah di sidebar; autentikasi, status login, dan profil pengguna dikelola langsung secara terpusat melalui tombol akun di header yang memicu dialog modal (*AuthModal*).
   * **Bagian Bawah Statis (*Pinned Bottom Actions*):** Tombol pembuka modal *Model & Kunci API* (dengan indikator status Crypto Vault: Hijau jika terbuka di RAM, Kuning jika terkunci PIN) dan tautan eksternal ke repositori GitHub proyek.
2. **Header Aplikasi Statis (Top Navigation Bar - 56px):**
   * **Brand Logo:** Logo Gettext AI dengan penanda edisi open-source.
   * **Indikator Model Aktif:** Menampilkan nama penyedia dan model yang sedang aktif (misal `Gemini: gemini-2.5-flash`), penanda status `(Combo)` jika fitur *auto-failover* kuota aktif, serta tombol aksi cepat *"Kunci RAM"*.
   * **Reputasi & Komunitas:** Menampilkan jumlah bintang repositori GitHub secara real-time.
   * **Tombol Akun Pengguna:** Menampilkan avatar/username pengguna yang login atau tombol *"Masuk / Daftar"* untuk pengguna Guest.
3. **Area Konten Utama Mandiri (*Independent Scroll Content Area*):**
   * Menggunakan kontainer `overflow-y-auto` dengan lebar terpusat maksimal `max-w-[1040px]`.
   * Saat pengguna menelusuri ratusan entri Gettext pada tabel editor atau riwayat proyek, sidebar di sebelah kiri dan header di bagian atas tetap stabil pada posisinya (*always visible*).

---

## 6. Skema Database Supabase (PostgreSQL + RLS)

Database Supabase menggunakan PostgreSQL dengan ekstensi `pgcrypto` untuk UUID RFC 4122 dan Row Level Security (RLS) di seluruh tabel pengguna:

### 6.1. Spesifikasi Tabel `public.user_settings`
Menyimpan konfigurasi pengguna dan preferensi model:

| Nama Kolom | Tipe Data | Constraint | Deskripsi & Keamanan |
| :--- | :--- | :--- | :--- |
| `user_id` | `UUID` | `PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE` | ID unik akun pengguna dari Supabase Auth. |
| `github_username` | `VARCHAR(100)` | Nullable | Username GitHub pengguna (jika login via GitHub OAuth). |
| `gemini_api_key_encrypted` | `TEXT` | Nullable | **Ciphertext JSON** AES-GCM 256-bit + salt + IV. Tidak pernah menyimpan plaintext. |
| `preferred_model` | `VARCHAR(50)` | `DEFAULT 'gemini-2.5-flash'` | Model AI default yang dipilih pengguna (misal: Gemini Flash). |
| `default_target_lang` | `VARCHAR(15)` | `DEFAULT 'id_ID'` | Bahasa target default untuk sesi editor. |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Waktu pembuatan entri pengaturan. |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Waktu pembaruan terakhir pengaturan. |

### 6.2. Spesifikasi Tabel `public.translation_histories`
Menyimpan snapshot sesi kerja file `.po` untuk pemulihan cepat lintas perangkat:

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | ID unik riwayat terjemahan. |
| `user_id` | `UUID` | `NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE` | Pemilik riwayat terjemahan. |
| `file_name` | `VARCHAR(255)` | `NOT NULL` | Nama file `.po` yang dikerjakan. |
| `source_lang` | `VARCHAR(20)` | `NOT NULL` | Kode bahasa sumber (misal: `en_US`, `ko_KR`, `auto`). |
| `target_lang` | `VARCHAR(20)` | `NOT NULL` | Kode bahasa target (misal: `id_ID`). |
| `total_strings` | `INT` | `DEFAULT 0` | Total baris/string yang ada di dalam file. |
| `translated_strings`| `INT` | `DEFAULT 0` | Jumlah baris yang sudah diterjemahkan (`msgstr` terisi). |
| `status` | `VARCHAR(20)` | `DEFAULT 'completed'` | Status pengerjaan: `'processing'`, `'completed'`, `'failed'`. |
| `po_header` | `JSONB` | `DEFAULT '{}'` | Metadata header GNU Gettext (Revision-Date, Plural-Forms, dll).|
| `po_entries` | `JSONB` | `NOT NULL` | Kumpulan entri baris PO (`[{ id, msgid, msgstr, msgctxt, flags }]`).|
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Waktu pertama kali file diunggah. |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Waktu sinkronisasi progres terakhir. |

### 6.3. Spesifikasi Tabel `public.glossaries`
Menyimpan kamus istilah teknis dan aturan Do Not Translate (DNT):

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | ID unik istilah glosarium (RFC 4122 UUID). |
| `user_id` | `UUID` | `NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE` | Pemilik istilah glosarium. |
| `project_tag` | `VARCHAR(100)` | `DEFAULT 'General'` | Tag pengelompokan (misal: "WordPress", "Open Source Tech").|
| `source_term` | `VARCHAR(255)` | `NOT NULL` | Istilah kata dalam bahasa sumber. |
| `target_term` | `VARCHAR(255)` | `NOT NULL` | Istilah kata dalam bahasa target (atau sama jika DNT). |
| `is_do_not_translate`| `BOOLEAN` | `DEFAULT FALSE` | Flag DNT: jika `true`, istilah dilarang diterjemahkan. |
| `description` | `TEXT` | Nullable | Catatan konteks penggunaan istilah bagi penerjemah. |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Waktu penambahan istilah ke database. |

### 6.4. Aturan Keamanan Row Level Security (RLS)
* Seluruh tabel (`user_settings`, `translation_histories`, `glossaries`) wajib mengaktifkan Row Level Security.
* Kebijakan akses (*Policies*) menjamin bahwa setiap pengguna terotentikasi **hanya** dapat melakukan operasi `SELECT`, `INSERT`, `UPDATE`, dan `DELETE` pada data miliknya sendiri di mana `auth.uid() = user_id`. Pengguna lain maupun pengunjung anonim tidak memiliki akses terhadap baris data tersebut.

---

## 7. Arsitektur Multi-Engine Penerjemahan

Aplikasi mendukung tiga rute mesin penerjemah yang dapat dipilih pengguna secara fleksibel:

### 7.1. Rute 1: Google Gemini Native SDK (`@google/genai`)
* **Pilihan Model:** `gemini-2.5-flash`, `gemini-3.8-flash`, dll.
* **Instruksi Sistem (*System Instruction*):** Menyuntikkan aturan imutabilitas variabel (%s, {name}), tag HTML, glosarium DNT, dan diksi UI/UX.
* **Kontrak JSON Terstruktur (*Structured Outputs*):**
  * **Input Payload:** Array objek `[{ index: number, msgid: string, context?: string }]`.
  * **Skema Output Respon:** Format JSON Array objek `[{ index: number, msgstr: string }]` yang dijamin ketat oleh skema `Type.ARRAY` dan `Type.OBJECT`.
* **Parameter Inferensi:** Suhu rendah (`temperature: 0.2`) untuk menjaga stabilitas deterministik dan mencegah halusinasi variabel.

### 7.2. Rute 2: Google Translate Online Engine (Bebas Batas Kuota 20 RPD)
* **Karakteristik Endpoint:** Menggunakan endpoint web GTX via HTTP GET (CORS Simple Request) yang bebas dari blokir preflight browser dan tanpa kewajiban API key.
* **Optimasi Ukuran URL:** Pemotongan otomatis kalimat panjang (*sentence chunking* < 1.500 karakter) agar aman dari batas panjang URL GET browser (8.192 karakter).
* **Proteksi Variabel:** Dilindungi oleh pipeline *Variable & Tag Token Masking* pra-terjemahan dan *Auto-Healing* pasca-terjemahan.

### 7.3. Rute 3: OpenAI-Compatible /chat/completions
* **Dukungan Provider:** Penyedia lokal (Ollama) maupun cloud (OpenRouter, DeepSeek, Groq, OpenAI, Custom Base URL).
* **Format Payload:** Standar payload percakapan OpenAI (`messages: [...]`) dengan instruksi format output JSON array yang identik.

### 7.4. Fitur Combo Model AI & Auto-Failover Orchestration
* **Tujuan & Ruang Lingkup:** Khusus model AI (Gemini, OpenRouter, DeepSeek, Groq, OpenAI). Mengatasi kendala batas kuota harian atau batasan per menit (*Rate Limit*) tanpa menghentikan proses terjemahan yang sedang berjalan.
* **Perbedaan dengan Google Translate:** Google Translate beroperasi tanpa kuota atau API key sehingga tidak membutuhkan auto-failover. Fitur Combo secara khusus menangani model-model LLM berbasis token/request kuota.
* **Mekanisme Deteksi Rate Limit (`isRateLimitError`):**
  * Memindai status kode HTTP 429, teks error `RESOURCE_EXHAUSTED`, `quota exceeded`, `rate limit`, `too many requests`, dan `overloaded`.
* **Rantai Failover Model (*Combo Chain*):**
  1. `gemini-3.8-flash` (Model Utama: Kecepatan tinggi)
  2. `gemini-2.5-flash` (Cadangan Pertama: Kuota terpisah & andal)
  3. `gemini-3.8-pro` (Cadangan Kedua: Kemampuan penalaran tinggi)
  4. `gemini-2.5-pro` (Cadangan Ketiga: Model kapasitas besar)
* **Pengulangan Mulus (*Seamless Retry*):** Begitu limit terdeteksi, mesin langsung beralih ke model berikutnya dalam antrean, memunculkan notifikasi peringatan kepada pengguna, memperbarui preferensi model di store, dan mengeksekusi ulang batch yang tertunda secara otomatis tanpa intervensi manual.

---

## 8. Arsitektur Keamanan Anti-XSS & Anti-Spam Rate Limiting

Keamanan data pengguna dan ketahanan aplikasi terhadap serangan web modern menjadi prioritas utama:

### 8.1. Proteksi Anti-XSS Berlapis (Multi-Layer Anti-XSS Defense)
Menjamin kunci API dan data pengguna terlindungi dari serangan injeksi skrip berbahaya (*Cross-Site Scripting*):
1. **Strict Content Security Policy (CSP) Headers:**
   * Diimplementasikan melalui tag `<meta http-equiv="Content-Security-Policy">` di `index.html`.
   * **Kebijakan `connect-src` Adaptif & Aman:** Mengizinkan `'self'`, `https:` (seluruh endpoint terenkripsi SSL/TLS publik), serta loopback lokal `http://localhost:*`, `http://127.0.0.1:*`, dan `http://[::1]:*` (untuk Ollama dan LLM lokal).
   * **Pencegahan Eksfiltrasi Data & Insecure Plaintext:** Menolak seluruh koneksi `http://` tidak terenkripsi ke internet publik. Skrip jahat tidak dapat mengeksfiltrasi data ke server HTTP publik non-enkripsi.
2. **Sanitasi Input Kunci API (`sanitizeApiKey`):**
   * Setiap kunci API yang ditempelkan pengguna dibersihkan secara otomatis dari tag HTML, protokol `javascript:`, null bytes (`\0`), dan karakter kontrol berbahaya sebelum disimpan.
3. **Imutabilitas DOM & Isolasi Render React:**
   * Teks asli (`msgid`), terjemahan (`msgstr`), dan komentar file `.po` selalu dirender menggunakan binding teks murni React JSX (`textContent`), **tanpa pernah menggunakan `dangerouslySetInnerHTML`**.
   * Script jahat yang disusupkan di dalam file `.po` (seperti `<script>alert(1)</script>`) hanya akan diperlakukan sebagai teks biasa dan tidak pernah dieksekusi oleh mesin browser.

### 8.2. Validasi Keamanan Base URL Kustom & Anti-SSRF Sisi Klien
Mengingat panggilan API kustom (Ollama & OpenAI-Compatible) dipicu langsung dari peramban klien (*Client-Side direct fetch*), sistem menyematkan validator keamanan khusus ([`src/lib/url-validator.ts`](file:///c:/Users/ikhsa/Downloads/potrans/src/lib/url-validator.ts)):
1. **Pemblokiran Cloud Metadata Service (Anti-Internal Probing):**
   * Memblokir keras alamat IP metadata instans cloud seperti `169.254.169.254` (AWS, GCP, Azure, DigitalOcean), `metadata.google.internal`, dan `100.100.100.200`.
2. **Pemblokiran Port Layanan Sensitif:**
   * Menolak permintaan ke port non-web sensitif seperti port 21 (FTP), 22 (SSH), 25 (SMTP), 445 (SMB), 2375 (Docker), 3306 (MySQL), 5432 (PostgreSQL), dan 6379 (Redis).
3. **Pembersihan Kredensial & CRLF Injection:**
   * Membuang kredensial *userinfo* (`user:password@`) dari URL dan membersihkan karakter kontrol CRLF (`\r`, `\n`) untuk mencegah *HTTP request splitting*.
4. **Wajib HTTPS untuk Internet Publik:**
   * Endpoint non-localhost dan non-LAN wajib menggunakan HTTPS terenkripsi untuk mencegah intersepsi man-in-the-middle (MITM) terhadap kunci API dan isi file Gettext.

### 8.3. Kriptografi Crypto Vault di Browser (Web Crypto AES-GCM 256-bit + PIN Master)
* **Prinsip Zero-Knowledge & Client-Side Encryption:**
  * Kunci API pengguna dienkripsi secara lokal di browser menggunakan Web Crypto API standar industri (`crypto.subtle`).
  * **Algoritma:** AES-GCM 256-bit dengan integritas data anti-tamper (authentication tag).
  * **Derivasi Kunci (KDF):** PBKDF2 dengan 100.000 iterasi SHA-256 dan salt acak kriptografis 16-byte.
  * **Penyimpanan Aman (Ciphertext Only):** Hanya ciphertext base64, salt, dan IV yang disimpan di `localStorage` atau disinkronkan ke Supabase.
  * **Isolasi RAM (In-Memory Session):** Kunci plaintext hanya didekripsi ke dalam RAM saat sesi dibuka dengan PIN Master, dan segera dibersihkan dari RAM saat pengguna mengklik *"Kunci RAM"*, menutup tab, atau me-refresh halaman.
  * **Proteksi Brute-Force PIN:** Pembatasan maksimal 5 kali percobaan PIN salah; jika terlampaui, sistem memberlakukan penguncian keamanan (*lockout*) selama 30 detik.

### 8.4. Sistem Anti-Spam & Rate Limiter Klien
Menggunakan algoritma *Sliding Window* dan *Action Cooldown Manager* di sisi klien ([`src/lib/rate-limiter.ts`](file:///c:/Users/ikhsa/Downloads/potrans/src/lib/rate-limiter.ts)):
* **Pembatasan Aksi Pengguna (Action Cooldowns):**
  * **Tes Koneksi API:** Dibatasi 1 kali per 2 detik untuk mencegah *request flooding*.
  * **Terjemah Baris Tunggal:** Dibatasi 1 kali per 1,2 detik per baris.
  * **Mulai Batch:** Cooldown 1 detik sebelum batch berikutnya dapat dipicu.
* **Deteksi Batas RPM Provider (Auto-Throttling):**
  * Mendeteksi ambang batas RPM (misal Google Translate 60 req/min atau Gemini Free 15 RPM).
  * Menampilkan pesan jeda otomatis dan penanganan HTTP 429 dengan *exponential backoff*.

---

## 9. Pipeline Proteksi Terjemahan Berlapis (Multi-Layer Localization Guard)

Untuk mengatasi kelemahan mendasar mesin penerjemah otomatis (termasuk Google Translate dan AI yang terkadang mengabaikan instruksi atau menerjemahkan di luar aturan), sistem menerapkan pipeline 3 lapis:

```text
[Teks Asli: msgid]
       │
       ▼
[Lapis 1: Pre-Translation Token Masking]
  ├─ Tag HTML/XML: <span class="x"> -> __TAG_0__
  ├─ Printf Specifiers: %s, %1$d, %.2f -> __VAR_0__
  ├─ Curly Placeholders: {name}, {{count}}, {0} -> __VAR_1__
  ├─ Helper Partikel Korea: {0}|hpp(이,가) -> {0} -> __VAR_2__
  └─ Kode Error/Identifier: [오류 코드 : PURPLE] -> [오류 코드 : __VAR_3__]
       │
       ▼
[Proses Mesin Penerjemah: Gemini / Google Translate / OpenAI]
       │
       ▼
[Lapis 2: Post-Translation Auto-Healing & Unmasking]
  ├─ Whitespace-Tolerant Token Recovery: __VAR_0__, __ VAR 0 __, _ VAR 0 _
  ├─ Error Code Auto-Healing: [Kode kesalahan: UNGU] dikembalikan ke [Kode kesalahan: PURPLE]
  └─ Glosarium DNT & Term Replacement Enforcement
       │
       ▼
[Lapis 3: Validation Guard & Visual Warning Tab]
  ├─ Pemeriksaan Variabel Hilang (Missing Placeholders)
  ├─ Pemeriksaan Variabel Tak Dikenal (Extra Placeholders)
  ├─ Deteksi Residu Partikel Korea (|hpp, (Lee, Ga))
  └─ Flagging visual: Border merah & tab filter "Peringatan"
```

### 9.1. Aturan Penanganan Spesifik
1. **Helper Partikel Tata Bahasa Korea (`|hpp` & `|josa`):**
   * Masalah: Teks gettext Korea sering memiliki helper partikel seperti `{0}|hpp(이,가)` atau `{0}|hpp(에게,게)`. Mesin penerjemah sering merusaknya menjadi teks kacau seperti `{0} (Lee, Ga)` atau `|hpp (kepada)`.
   * Solusi: Sistem otomatis menormalisasi `{0}|hpp(...)` menjadi `{0}` murni sebelum diterjemahkan, dan menambahkan *guard* untuk mendeteksi residu sintaks partikel.
2. **Kode Error & Identifier Teknis dalam Kurung Siku (`[Label : CODE]`):**
   * Masalah: Teks seperti `[오류 코드 : PURPLE]` sering diterjemahkan salah menjadi `[Kode kesalahan: UNGU]` karena kata bahasa Inggris `PURPLE` dianggap sebagai kosakata warna biasa.
   * Solusi: Kode teknis di-mask sebagai `__VAR_N__` dan diperkuat dengan logika *auto-healing*. Labelnya diterjemahkan menjadi *"Kode kesalahan"*, namun kode error `PURPLE` terkunci 100% dan tidak diindonesiakan.
3. **Imutabilitas Tag HTML/XML:**
   * Seluruh tag `<img ...>`, `<a ...>`, `<br/>` di-mask menjadi `__TAG_N__`. Atribut tag (seperti `id="Guide_KR"`) dilarang keras berubah menjadi `_EN` atau `_ID`.

---

## 10. Struktur Folder Repositori Open-Source

```text
po-translator-ai/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
├── supabase/
│   └── migrations/
│       └── 20261111082700_init_po_translator.sql   # Skema PostgreSQL + RLS
├── src/
│   ├── components/
│   │   ├── atoms/                                  # BadgeApp, ButtonApp, InputApp, GithubIcon
│   │   ├── molecules/                              # CryptoVaultModal (AES-GCM PIN Manager)
│   │   └── organisms/                              # Komponen Fitur Utama
│   │       ├── Header.tsx                          # Navigasi & Status Vault
│   │       ├── Sidebar.tsx                         # Navigasi Tab
│   │       ├── PoDropzone.tsx                      # Unggah File PO
│   │       ├── BatchControlBar.tsx                 # Kontrol Batch (100, 200, 500 Baris)
│   │       ├── PoEditorTable.tsx                   # Editor, Single Translate, Filter Peringatan
│   │       ├── ExportModal.tsx                     # Unduh & Salin PO
│   │       ├── HistoryManager.tsx                  # Riwayat & Pemulihan Sesi
│   │       ├── GlossaryManager.tsx                 # Glosarium Istilah (DNT, Tags, Supabase Sync)
│   │       ├── ActivitySummary.tsx                 # Metrik Dashboard
│   │       ├── QuickAccess.tsx                     # Pintasan Dashboard
│   │       ├── DocsViewer.tsx                      # Dokumentasi Internal
│   │       └── ContributorsWall.tsx                # Hall of Fame Kontributor GitHub
│   ├── docs/                                       # File Markdown Dokumentasi Dashboard
│   │   ├── getting-started.md
│   │   ├── self-hosting.md
│   │   └── contributing-guide.md
│   ├── lib/
│   │   ├── crypto-vault.ts                         # Web Crypto API AES-GCM 256-bit + PBKDF2
│   │   ├── rate-limiter.ts                         # Sliding-window anti-spam & action cooldowns
│   │   ├── google-translate.ts                     # Google Translate Engine & Variable Masking
│   │   ├── gemini.ts                               # Multi-Engine AI Orchestrator & Auto-Healer
│   │   ├── ai-providers.ts                         # Konfigurasi Provider (Gemini, Ollama, OpenRouter, dll.)
│   │   ├── po-parser.ts                            # PO Parser/Compiler & Placeholder Validator
│   │   ├── supabase.ts                             # Supabase Client & Database Types
│   │   └── github.ts                               # GitHub REST API Integration
│   ├── store/
│   │   ├── useAppStore.ts                          # State PO File, Batch, Settings, Glossaries Sync
│   │   ├── useAuthStore.ts                         # State Supabase Auth & Session Listener
│   │   └── useVaultStore.ts                        # State Crypto Vault (Ciphertext & Session RAM)
│   ├── App.tsx
│   └── main.tsx
├── .env.example                                    # Template environment variables
├── CONTRIBUTING.md                                 # Panduan kontribusi open-source
├── CODE_OF_CONDUCT.md                              # Kode etik komunitas
├── LICENSE                                         # Lisensi MIT
├── README.md                                       # Dokumentasi utama repositori
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 11. Standar Tata Kelola Open-Source & Kontributor (Community Governance)

1. **Kemudahan Setup Lokal (*Zero-Friction Local Dev*):**
   * Kontributor baru cukup menjalankan `npm install` dan `npm run dev` untuk menjalankan aplikasi penuh dalam mode *Guest/Local* bahkan sebelum mengonfigurasi Supabase.
2. **Keamanan Kredensial (Zero Key Leak):**
   * Tidak ada API Key yang di-*hardcode*. File `.env.example` disediakan dengan instruksi jelas untuk `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan `VITE_GITHUB_REPO`.
   * Kunci API pengguna selalu terlindungi di Crypto Vault dan tidak pernah tersimpan sebagai plaintext di database.
3. **Apresiasi Kontributor Otomatis:**
   * Setiap *Pull Request* yang di-*merge* ke *branch* `main` akan secara otomatis menampilkan profil kontributor tersebut di tab **Kontributor & Komunitas** pada Dashboard aplikasi.

---

## 12. Indikator Keberhasilan Proyek (Success Metrics)

| Kategori | Indikator (KPI) | Target Keberhasilan |
| :--- | :--- | :--- |
| **Kualitas Teknis & Sintaks** | *Syntax & Variable Integrity* | 100% file `.po` hasil unduhan berhasil dikompilasi ke `.mo` tanpa error di Poedit; 0% kerusakan variabel placeholder. |
| **Resiliensi Terjemahan Mesin** | *Error Code & Tag Preservation* | 100% kode error (`[... : CODE]`) dan tag HTML tetap utuh tanpa terjemahan nama warna liar. |
| **Keamanan & Kriptografi** | *Zero Plaintext Exposure* | 0 kunci API plaintext yang tersimpan di disk atau terkirim ke database Supabase; proteksi brute-force PIN aktif. |
| **Performa Batch** | Kecepatan & Kapasitas Batch | Mampu memproses batch 100, 200, hingga 500 baris secara stabil tanpa bottleneck memori browser. |
| **Pengalaman Developer** | *Time-to-First-Setup* | $< 5$ menit dari `git clone` hingga aplikasi berjalan penuh di `localhost`. |