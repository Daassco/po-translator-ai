# Panduan Kontribusi (Contributing Guide)

Terima kasih atas ketertarikan Anda untuk berkontribusi pada **Penerjemah PO AI**! Proyek ini terbuka untuk siapa saja yang ingin memperbaiki bug, menyempurnakan parser GNU Gettext, menambahkan kamus glosarium, atau memperbaiki performa prompt AI.

## Cara Berkontribusi

1. **Fork Repositori:** Klik tombol *Fork* di pojok kanan atas halaman GitHub repositori ini.
2. **Clone ke Komputer Lokal:**
   ```bash
   git clone https://github.com/<username-anda>/po-translator-ai.git
   cd po-translator-ai
   npm install
   ```
3. **Buat Branch Fitur Baru:**
   ```bash
   git checkout -b feature/nama-fitur-baru
   ```
4. **Jalankan Dev Server:**
   ```bash
   npm run dev
   ```
5. **Uji Perubahan & Build:**
   ```bash
   npm run build
   ```
6. **Commit & Push:**
   ```bash
   git add .
   git commit -m "feat: tambahkan fitur X"
   git push origin feature/nama-fitur-baru
   ```
7. **Buka Pull Request:** Buat Pull Request ke branch `main` repositori upstream.

---

## Standar Kode & Desain

- Seluruh kode ditulis dalam **TypeScript** dengan `strict: true`.
- Desain visual wajib mengikuti spesifikasi warna dan tipografi di `design.md`.
- Komponen bervariant wajib menggunakan `cva` (`class-variance-authority`) dan `cn()` utility.
- Jangan pernah menyertakan kredensial atau API key di dalam kode sumber repositori.
