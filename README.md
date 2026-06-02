# Practice Exam App

Web app untuk persiapan ujian sertifikasi IT (HCIA-Datacom & lainnya).

## Setup

```bash
npm install
npm run dev
```

Buka http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Cara Pakai

1. Klik **Import Bank Soal (JSON)** di halaman Home
2. Pilih file JSON sesuai schema (contoh: `public/sample_bank.json`)
3. Konfigurasi jumlah soal, timer, dan filter topik
4. Klik **Mulai Ujian**
5. Gunakan **Editor** untuk memperbaiki soal atau melampirkan gambar

## Sample Bank

File `public/sample_bank.json` berisi 5 soal contoh HCIA-Datacom untuk testing.

## Stack

- React 18 + Vite
- Tailwind CSS
- Zustand (state management)
- React Router v6
