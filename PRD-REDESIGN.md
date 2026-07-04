# PRD — Perombakan Desain "Practice Exam App" (Modern UI Redesign)

**Versi:** 1.0 · **Tanggal:** 4 Juli 2026 · **Status:** Menunggu approval

---

## 1. Latar Belakang & Analisa Kondisi Saat Ini

### 1.1 Stack & Arsitektur (tidak berubah)
- React 18 + Vite 6 + Tailwind CSS 3 + Zustand 5 + React Router 6
- Persistensi: IndexedDB (bank soal) + localStorage (bookmark, riwayat)
- 4 halaman: **Home** (pilih bank, konfigurasi, riwayat), **Exam** (soal + timer + nav), **Result** (skor + review), **Editor** (edit soal & gambar)
- Fitur yang sudah ada dan harus tetap berfungsi: import JSON/HTML, practice mode, pause, bookmark, range soal (51-100), shuffle, filter topik, riwayat + detail review, export deploy

### 1.2 Masalah Desain Saat Ini
| # | Masalah | Dampak |
|---|---------|--------|
| 1 | Tampilan "default Tailwind": abu-abu + biru generik, kartu putih `shadow-sm` datar | Terlihat seperti prototipe, bukan produk |
| 2 | Ikon memakai emoji (🚀 ✏️ 🔖 ⏸ 📋 🏁) | Tidak konsisten antar OS/browser, terkesan tidak profesional |
| 3 | Tanpa font khusus (system default) & hierarki tipografi lemah | Kurang karakter, heading/body kurang kontras |
| 4 | Tidak ada design token (warna semantik, radius, shadow terdefinisi) | Styling tidak konsisten antar halaman |
| 5 | Tidak ada dark mode | Belajar malam hari melelahkan mata |
| 6 | Layout desktop sempit (`max-w-2xl`) padahal layar lebar; Editor & Home tidak memanfaatkan ruang | Desktop terasa seperti mobile yang dilebarkan |
| 7 | Mobile fungsional tapi kasar: modal nav fullscreen polos, bottom bar padat, area sentuh kecil (tombol nav 32px) | Ergonomi mobile kurang |
| 8 | Hampir tanpa micro-interaction (transisi halaman, feedback jawaban, animasi skor) | Terasa kaku |
| 9 | Result page: blok hijau/merah solid besar, filter tab polos | Kurang informatif & kurang modern (tidak ada ring chart / breakdown topik) |
| 10 | Aksesibilitas: kontras beberapa teks abu (`text-gray-400`), fokus keyboard tidak terlihat, tanpa `aria-label` | Kurang aksesibel |

---

## 2. Tujuan & Sasaran

**Tujuan utama:** Merombak seluruh UI menjadi desain modern, konsisten, dan nyaman dipakai lama (studi berjam-jam), responsif penuh dari 360px (mobile) sampai 1440px+ (desktop) — **tanpa mengubah logika bisnis, store, maupun format data**.

**Sasaran terukur:**
1. Semua halaman memakai design system yang sama (token warna, tipografi, radius, shadow).
2. Layout menyesuaikan 3 breakpoint: mobile (<640px), tablet (640–1024px), desktop (>1024px).
3. Dark mode penuh dengan toggle + ikut preferensi sistem.
4. Skor Lighthouse aksesibilitas ≥ 90 (kontras, fokus, label).
5. Zero regresi fungsional: semua fitur pada §1.1 tetap bekerja.

**Non-goals (di luar scope):**
- Tidak mengubah skema JSON bank soal, scorer, parser HTML, maupun struktur store.
- Tidak menambah fitur baru (statistik lanjutan, akun, sync cloud).
- Tidak migrasi framework/library besar (tetap Tailwind 3, tanpa UI kit seperti MUI).

---

## 3. Design System

### 3.1 Identitas Visual
- **Kepribadian:** fokus, tenang, profesional — seperti aplikasi belajar premium (Notion/Linear-esque), bukan gamified.
- **Warna primer:** **Indigo** (`indigo-600` terang / `indigo-400` gelap) — menggantikan biru default; aksen sekunder **violet** untuk gradien halus.
- **Warna semantik:** success = emerald, danger = rose, warning = amber, bookmark = amber.
- **Permukaan:** light mode = `slate-50` background + kartu putih; dark mode = `slate-950` background + kartu `slate-900` dengan border `slate-800` (bukan shadow).

### 3.2 Tipografi
- Font: **Inter Variable** (self-host via `@fontsource-variable/inter` — tanpa request eksternal, tetap jalan offline).
- Skala: `text-xs` meta → `text-sm` body sekunder → `text-base` soal → `text-lg/xl` judul section → `text-3xl+` skor/heading. Angka timer & skor pakai `tabular-nums`.

### 3.3 Ikon
- Ganti semua emoji dengan **lucide-react** (tree-shakeable, ~1KB per ikon): `Play`, `Pause`, `Bookmark`, `Flag`, `Timer`, `Upload`, `FileJson`, `Globe`, `Pencil`, `Grid3x3`, `ChevronLeft/Right`, `Check`, `X`, `Moon`, `Sun`, `History`, `Trash2`, `Download`.

### 3.4 Komponen Dasar (dibuat sekali, dipakai semua halaman)
| Komponen | Spesifikasi |
|----------|-------------|
| `Button` | Varian: primary (indigo solid), secondary (border), ghost, danger, success. Ukuran sm/md/lg. Radius `rounded-xl`, focus ring jelas, state disabled & loading |
| `Card` | `rounded-2xl`, light: `bg-white shadow-sm ring-1 ring-slate-200/60`; dark: `bg-slate-900 ring-slate-800` |
| `Toggle` | Switch 44×24px (area sentuh ≥44px), animasi spring |
| `Modal` | Desktop: dialog tengah dengan backdrop blur + animasi scale-in. **Mobile: bottom sheet** (slide-up, drag handle) |
| `Badge / Chip` | Untuk topik, multi-answer, status practice, LULUS/GAGAL |
| `Input / Select` | Tinggi 44px di mobile, label konsisten, focus ring indigo |
| `EmptyState` | Ilustrasi ikon + teks + CTA (dipakai saat belum ada bank/riwayat) |

### 3.5 Motion
- Transisi antar halaman: fade + slide halus (CSS, tanpa lib tambahan).
- Pergantian soal: slide singkat sesuai arah (next/prev).
- Feedback practice mode: opsi benar/salah muncul dengan animasi ringan (scale + fade).
- Skor di Result: angka count-up + ring chart animasi stroke.
- Hormati `prefers-reduced-motion`.

---

## 4. Spesifikasi Per Halaman

### 4.1 Home — "Dashboard"
**Desktop (>1024px):** layout 2 kolom — kiri (utama, ~2/3): pemilihan bank + konfigurasi + tombol mulai; kanan (~1/3): riwayat ujian sticky. Lebar kontainer naik ke `max-w-6xl`.
**Mobile:** satu kolom, urutan: header → bank → konfigurasi → mulai → riwayat.

Perubahan utama:
1. **Header app bar**: logo/nama app + toggle dark mode + tombol Editor (ikon). Export Deploy pindah ke menu kecil di kartu bank (decluttering).
2. **Kartu bank soal** → grid kartu (bukan pill sebaris): nama sertifikasi besar, kode ujian, jumlah soal, tombol hapus di menu ⋯. Kartu terpilih ber-ring indigo.
3. **Konfigurasi ujian** dalam kartu dengan section jelas: jumlah soal/range + timer (grid responsif `grid-cols-1 sm:grid-cols-2`), toggle shuffle & practice mode dengan deskripsi, chip topik.
4. **Tombol mulai**: primary besar full-width + tombol sekunder "Review Bookmark (n)".
5. **Riwayat**: kartu ringkas dengan skor sebagai **ring chart mini**, badge LULUS/GAGAL, tanggal relatif ("2 jam lalu"), tombol Detail ikon. Empty state bila kosong.
6. **Empty state awal** (belum ada bank): ilustrasi + dua CTA import yang jelas.

### 4.2 Exam — "Fokus Mode"
**Desktop:** sidebar nav kiri tetap, tapi dirapikan: header sidebar berisi ringkasan (n dijawab / n bookmark), grid nomor lebih lega (36px), legend permanen di bawah.
**Mobile:** header ramping; **bottom sheet** untuk navigasi soal (menggantikan modal fullscreen), tombol nomor 44×44px.

Perubahan utama:
1. **Header**: kiri = nomor soal + badge practice; tengah = timer pill (mengecil jadi sticky mini saat scroll di mobile); kanan = bookmark (ikon) + tombol "Selesai".
2. **Timer**: pill dengan ikon; < 5 menit berubah amber + pulse halus; < 1 menit rose.
3. **Progress bar**: gradient indigo→violet, tetap tipis.
4. **QuestionCard**: padding lebih lega, nomor soal besar, opsi jawaban dengan **huruf label dalam lingkaran** (bukan radio/checkbox mentah — radio native disembunyikan, tetap accessible), state selected = ring indigo + bg indigo muat, hover lift halus.
5. **Practice feedback**: benar = emerald + ikon check animasi; salah = rose; jawaban benar yang terlewat ditandai. Kartu penjelasan dengan ikon lampu.
6. **Bottom bar**: Prev (ikon) — tombol grid nav (mobile) — Submit Jawaban (practice) — Next primary. Aman dari home-indicator iOS (`safe-area-inset`).
7. **Pause overlay**: glassmorphism (blur kuat), kartu tengah dengan ikon besar, timer tersembunyi.
8. **Keyboard shortcut** (desktop): `←/→` pindah soal, `1-9`/`A-E` pilih opsi, `B` bookmark. (Peningkatan kecil, tanpa ubah store.)

### 4.3 Result — "Score Report"
1. **Hero skor**: bukan blok warna solid — kartu dengan **ring chart besar animasi** (stroke indigo/emerald/rose), angka count-up, badge LULUS/GAGAL, meta (waktu, benar/salah, passing 60%).
2. **Breakdown per topik** (data sudah ada di `details` + `q.topic`): bar horizontal benar/salah per topik — murni tampilan, tanpa ubah scorer.
3. **Filter tabs** → segmented control dengan counter per kategori (Semua 65 · Salah 12 · Benar 53 · Bookmark 4).
4. **ReviewItem**: kartu netral (putih/slate) dengan aksen border kiri hijau/merah — bukan seluruh kartu berwarna; opsi jawaban ditata seperti QuestionCard; penjelasan collapsible.
5. **Desktop:** hero + breakdown berdampingan (2 kolom), review list di bawah `max-w-3xl`.

### 4.4 Editor — "Workbench"
1. Layout 2 panel di desktop (list soal kiri + form kanan) dirapikan dengan design system baru; di mobile jadi 2 langkah (list → detail dengan tombol back).
2. Semua input/button/badge memakai komponen dasar §3.4.
3. Search & filter topik jadi toolbar sticky di atas list.

---

## 5. Responsiveness — Aturan Umum

| Aspek | Mobile (<640) | Tablet (640–1024) | Desktop (>1024) |
|-------|---------------|-------------------|-----------------|
| Kontainer | full + `px-4` | `max-w-2xl` | Home `max-w-6xl`, Exam full + sidebar, Result `max-w-5xl` |
| Nav soal | Bottom sheet, tombol 44px | Bottom sheet | Sidebar tetap |
| Modal | Bottom sheet | Dialog tengah | Dialog tengah |
| Target sentuh | Min 44×44px semua kontrol | 40px | 36px |
| Bottom bar Exam | + `env(safe-area-inset-bottom)` | sama | sama |
| Font soal | `text-base` | `text-base` | `text-lg` opsional |

---

## 6. Dark Mode
- Strategi: Tailwind `darkMode: 'class'` + store kecil (`uiStore`) persist ke localStorage, default ikut `prefers-color-scheme`.
- Toggle di header Home & Exam (ikon Sun/Moon).
- Semua komponen dasar sudah membawa varian dark sejak awal — bukan retrofit.

## 7. Aksesibilitas
- Focus ring terlihat di semua kontrol (`focus-visible:ring-2 ring-indigo-500`).
- Kontras teks minimal AA (ganti `text-gray-400` pada teks penting → `slate-500/600`).
- `aria-label` untuk tombol ikon; `role="dialog"` + focus trap pada modal; `aria-live` untuk timer < 5 menit.
- Radio/checkbox tetap elemen native (visually hidden) agar screen reader & keyboard tetap bekerja.

---

## 8. Rencana Implementasi (Fase)

| Fase | Isi | Perkiraan |
|------|-----|-----------|
| **F1 — Fondasi** | Install `lucide-react` + `@fontsource-variable/inter`; tailwind.config (palette, font, darkMode, animasi); index.css (base, scrollbar, safe-area); komponen dasar (Button, Card, Toggle, Modal/BottomSheet, Badge, Input, EmptyState); uiStore dark mode | 1 sesi |
| **F2 — Exam** | Header, timer, QuestionCard, OptionButton, QuestionNav, bottom bar, pause overlay, bottom-sheet nav, keyboard shortcut | 1 sesi |
| **F3 — Home** | App bar + dark toggle, kartu bank grid, konfigurasi, riwayat + ring mini, empty state, modal import HTML | 1 sesi |
| **F4 — Result** | Hero ring chart, breakdown topik, segmented filter, ReviewItem baru | 1 sesi |
| **F5 — Editor & polish** | Editor 2 panel, transisi halaman, audit aksesibilitas, uji 360px–1440px via preview | 1 sesi |

**Dependensi baru:** `lucide-react`, `@fontsource-variable/inter` (keduanya ringan, tanpa runtime CSS-in-JS).

## 9. Kriteria Sukses / Acceptance
1. Semua alur berfungsi identik: import JSON & HTML, mulai ujian (biasa/range/shuffle/topik/practice/bookmark), pause, submit, riwayat + detail, editor, export.
2. Tidak ada emoji tersisa sebagai ikon UI.
3. Dark mode konsisten di 4 halaman tanpa "flash" putih saat load.
4. Layout diverifikasi di 375px, 768px, 1280px (screenshot bukti per halaman).
5. Tidak ada perubahan pada `scorer.js`, `jsonValidator.js`, `htmlParser.js`, format bank JSON, dan struktur data store.
