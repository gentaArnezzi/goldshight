# Product Requirements Document — GoldSight

**Versi:** 1.0
**Tanggal:** 13 Juni 2026
**Pemilik:** Ji
**Status:** Disetujui untuk eksekusi

---

## 1. Executive Summary

GoldSight adalah dashboard web interaktif yang melengkapi skripsi *"Perbandingan ARIMAX, XGBoost, dan LSTM untuk Prediksi Return Kumulatif Emas Lima Hari ke Depan"*. Aplikasi ini terdiri dari dua bagian utama: (a) visualisasi mendalam dan analitis terhadap hasil penelitian pada test set 2024–2025, dan (b) replay *out-of-sample* pada data 2026 yang berkelanjutan, sebagai validasi empiris terhadap keterbatasan rezim yang diidentifikasi pada Bab 4.3 skripsi.

Aplikasi ini diposisikan sebagai luaran teknis (*CS engineering deliverable*) dari penelitian, **bukan** sebagai alat pengambilan keputusan investasi atau sistem peringatan dini.

---

## 2. Tujuan dan Sasaran

### Tujuan primer

1. Menyediakan luaran berbentuk produk perangkat lunak yang memperlihatkan kompetensi *full-stack engineering* sebagai komponen tugas akhir program studi Computer Science.
2. Memvalidasi keterbatasan pergeseran rezim pasar yang diidentifikasi di Bab 4.3 melalui pengamatan empiris pada periode di luar test set resmi.
3. Memfasilitasi eksplorasi interaktif terhadap hasil penelitian, baik bagi penguji maupun publik.

### Sasaran terukur

- Dashboard fungsional dengan dua mode (2024–2025 dan 2026) yang dapat didemonstrasikan pada sidang.
- Pipeline otomasi yang berjalan harian dengan tingkat keberhasilan ≥95% selama periode pra-sidang.
- Sub-temuan empiris dari replay 2026 yang dapat dilaporkan di Bab IV (subbab baru 4.4).
- Web dapat diakses publik dengan URL stabil hingga minimal 12 bulan pasca sidang.

---

## 3. Stakeholder

| Peran | Pihak | Kepentingan |
|---|---|---|
| Pemilik produk | Ji | Eksekutor, pengelola, pemilik infrastruktur |
| Pembimbing | Dosen pembimbing | Penilai luaran tambahan, persetujuan integrasi ke skripsi |
| Penguji sidang | Tim penguji | Mengevaluasi luaran sebagai bagian penilaian skripsi |
| Pengguna publik | Akademisi/peneliti lain, pengembang | Eksplorasi hasil penelitian |

---

## 4. Lingkup Produk

### 4.1 Termasuk dalam lingkup

- Dashboard multi-halaman berbasis Next.js untuk visualisasi hasil 2024–2025 dan replay 2026.
- Pipeline FastAPI untuk inferensi model XGBoost dan LSTM pada data baru.
- Otomasi harian melalui GitHub Actions untuk menarik data Yahoo Finance, menjalankan inferensi, dan memperbarui artefak data.
- Toggle bahasa Indonesia–Inggris pada UI.
- Disclaimer akademis prominent di setiap halaman.

### 4.2 Tidak termasuk dalam lingkup

- Pelatihan ulang model dengan data baru.
- Inferensi ARIMAX pada data 2026 (ARIMAX hanya ditampilkan untuk 2024–2025).
- Studi ablasi pada data 2026 (paket fitur tetap NO_G3 untuk replay).
- Uji signifikansi statistik formal pada data 2026 (sampel terlalu kecil; ditampilkan sebagai *informational only*).
- Sistem peringatan dini, sinyal trading, atau bentuk rekomendasi investasi apa pun.
- Autentikasi pengguna atau akun.
- Database; semua state disimpan sebagai berkas JSON dalam repo.

### 4.3 Asumsi

- Model XGBoost dan LSTM final dari notebook 04 dan 05 sudah disimpan sebagai artefak dapat dimuat ulang (`.json` untuk XGBoost, `.h5` atau SavedModel untuk LSTM), beserta scaler yang sudah di-fit pada train+val 2010–2023.
- Yahoo Finance dapat diakses melalui pustaka `yfinance` untuk simbol GLD, DX-Y.NYB, ^GSPC, CL=F, ^TNX, ^VIX.
- Pengguna mengakses dashboard via browser desktop modern; responsivitas mobile bersifat *best-effort*, bukan prioritas utama.

---

## 5. User Stories

### 5.1 Sebagai penguji sidang

- Saya ingin melihat ringkasan hasil penelitian secara visual di satu halaman, sehingga dapat memvalidasi klaim utama skripsi.
- Saya ingin memilih tanggal spesifik di test set 2024–2025 dan melihat prediksi setiap model versus aktual, sehingga dapat mengevaluasi perilaku model pada kondisi tertentu.
- Saya ingin melihat apakah model bertahan pada data 2026 di luar evaluasi resmi, sehingga dapat menilai validitas kesimpulan tentang keterbatasan rezim.

### 5.2 Sebagai pembaca akademik

- Saya ingin menjelajahi hasil studi ablasi secara interaktif, sehingga dapat memahami kontribusi tiap kelompok fitur.
- Saya ingin membaca keterbatasan dan disclaimer agar tidak menafsirkan hasil sebagai rekomendasi investasi.

### 5.3 Sebagai pengembang/peneliti lain

- Saya ingin memahami pipeline pra-pemrosesan dan inferensi sehingga dapat memverifikasi metodologi.
- Saya ingin mengakses data hasil prediksi (mentah) untuk reproduksi atau penelitian lanjutan.

---

## 6. Persyaratan Fungsional

### 6.1 Halaman 1 — Beranda / Ringkasan

- Penjelasan ringkas penelitian (3–4 paragraf).
- Kartu metrik final test set 2024–2025: MAE, RMSE, DA untuk tiga model + dua benchmark.
- Highlight kesimpulan utama: "LSTM ≈ XGBoost secara statistik, keduanya > ARIMAX, hanya XGBoost kokoh > zero benchmark".
- Tautan navigasi ke halaman lain.
- Indikator status: tanggal terakhir update data 2026.
- Toggle bahasa.

### 6.2 Halaman 2 — Hasil Test Set 2024–2025

#### 6.2.1 Komponen timeline

- Plot interaktif aktual vs prediksi (ARIMAX, XGBoost, LSTM) sepanjang 2024–2025.
- Toggle visibilitas tiap model.
- Range slider untuk zoom periode.
- Hover/click pada titik tanggal → menampilkan detail.

#### 6.2.2 Komponen drill-down per tanggal

- Date picker (rentang 2024-01-02 sampai 2025-12-30).
- Kartu untuk tanggal terpilih: aktual, prediksi tiap model, eror absolut tiap model.
- Konteks: aktual ±N hari di sekitar tanggal terpilih.

#### 6.2.3 Komponen analisis

- Tabel metrik final per model (Tabel 4.7 skripsi).
- Tabel uji signifikansi (Tabel 4.9 skripsi) dengan tooltip penjelasan tiap uji.
- Plot residual vs predicted (Gambar 4.7 skripsi) untuk tiap model.
- Plot QQ residual (Gambar 4.8 skripsi) untuk tiap model.
- Plot distribusi error (Gambar 4.5 skripsi).
- Plot proporsi arah positif (Gambar 4.6 skripsi).

#### 6.2.4 Komponen breakdown analitis (insight baru dari Opsi A)

- Breakdown eror berdasarkan magnitudo aktual: histogram MAE per *bucket* aktual (≤−0.02, −0.02 sampai −0.01, ..., ≥0.04).
- Breakdown eror berdasarkan kuartal: tabel MAE/RMSE/DA per kuartal 2024Q1, 2024Q2, ..., 2025Q4.
- Heatmap eror per bulan × model.

### 6.3 Halaman 3 — Replay Out-of-Sample 2026

> Disclaimer prominent di header: *"Validasi empiris di luar evaluasi resmi. Sampel terbatas. Bukan rekomendasi investasi."*

#### 6.3.1 Komponen timeline

- Plot interaktif aktual vs prediksi (XGBoost, LSTM) untuk 2026 sejauh ini.
- ARIMAX **tidak ditampilkan** di halaman ini.
- Indikator tanggal terakhir update.

#### 6.3.2 Komponen drill-down per tanggal

- Date picker (rentang 2026-01-02 sampai tanggal terakhir update).
- Kartu untuk tanggal terpilih: aktual (bila tersedia, yaitu target date ≤ tanggal terakhir update − 5 hari perdagangan), prediksi XGBoost, prediksi LSTM, eror absolut.
- Status untuk tanggal yang belum bisa dievaluasi: "Aktual belum tersedia (horizon 5 hari belum lewat)".

#### 6.3.3 Komponen metrik agregat 2026

- MAE, RMSE, DA agregat untuk 2026 (hanya tanggal yang aktualnya sudah tersedia).
- **Side-by-side comparison: MAE 2026 vs MAE test set 2024–2025**, untuk XGBoost dan LSTM.
- Label kontekstual: *"Berdasarkan N hari perdagangan; sampel terbatas, tidak menarik kesimpulan statistik formal."*

#### 6.3.4 Komponen analisis (paritas dengan 2024–2025)

- Plot residual vs predicted untuk 2026.
- Plot QQ residual untuk 2026.
- Plot distribusi error untuk 2026.
- Plot proporsi arah positif untuk 2026.
- Catatan kaki: *"Visualisasi diagnostik berdasarkan N observasi; interpretasi terbatas akibat ukuran sampel."*

### 6.4 Halaman 4 — Studi Ablasi

- Tabel interaktif: pilih model + paket fitur, tampilkan MAE/RMSE/DA validation.
- Visualisasi bar chart: MAE per paket fitur untuk tiap model (Tabel 4.6 skripsi).
- Penjelasan singkat tiap kelompok fitur (dollar and rates, risk sentiment, commodity proxy, GOLD_ONLY).
- Insight kunci: NO_G3 terbaik untuk XGBoost dan LSTM, FULL terbaik untuk ARIMAX.
- Tautan ke Bab 4.2.2 skripsi (PDF) untuk interpretasi ekonomi lengkap.

### 6.5 Halaman 5 — Tentang dan Keterbatasan

- Ringkasan metodologi penelitian (3–5 paragraf).
- Daftar keterbatasan (mirroring Bab 4.3): rezim tunggal bull, sampel terbatas, sinyal fitur lemah, asimetri walk-forward, dst.
- Disclaimer akademis lengkap.
- Tautan ke PDF skripsi lengkap.
- Tautan ke repo GitHub.
- Tautan kontak/referensi.

### 6.6 Komponen lintas-halaman

- Header navigasi konsisten dengan toggle bahasa (ID/EN) dan link ke semua halaman.
- Footer dengan disclaimer, kredit, tanggal terakhir update data.
- Banner status data: hijau bila update <48 jam, kuning bila 48 jam–7 hari, merah bila >7 hari.
- Loading states pada semua komponen async.
- Error boundaries dengan pesan informatif bila data gagal dimuat.

---

## 7. Persyaratan Non-Fungsional

| Aspek | Persyaratan |
|---|---|
| Performa | Halaman utama LCP <2.5s pada koneksi 3G cepat. Plot interaktif render <500ms setelah data tersedia. |
| Aksesibilitas | Kontras minimal WCAG AA. Navigasi keyboard. Alt text pada semua grafik (atau ringkasan teks). |
| Responsivitas | Layout desktop optimal (≥1280px). Tablet (≥768px) fungsional. Mobile *best-effort*. |
| Keamanan | Tidak ada autentikasi. Tidak ada PII. Rate limiting di FastAPI bila terbuka publik. |
| Reliabilitas | Pipeline harian dengan retry. Graceful degradation bila API gagal. |
| Observabilitas | Notifikasi email pada workflow failure. Log GitHub Actions tersimpan ≥30 hari. |
| Bahasa | UI Indonesia (default) dan Inggris (toggle). Konten teks: kedua bahasa lengkap. |

---

## 8. Arsitektur Teknis

### 8.1 Komponen sistem (versi awal)

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                    │
│  ┌──────────────────┐  ┌─────────────────────────────┐  │
│  │ /web (Next.js)   │  │ /api (FastAPI)              │  │
│  │ /ml-pipeline     │  │ /models (.h5, .json, .pkl)  │  │
│  │ /data            │  │ .github/workflows/          │  │
│  └──────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │                              │
         │ deploy on push               │ deploy on push
         ▼                              ▼
┌─────────────────┐           ┌─────────────────────────┐
│ Vercel          │ ◄──fetch──┤ Railway / Render        │
│ (Next.js front) │           │ (FastAPI inference API) │
└─────────────────┘           └─────────────────────────┘
                                       ▲
                                       │ daily cron
                              ┌────────┴────────┐
                              │ GitHub Actions  │
                              │ - pull Yahoo    │
                              │ - run inference │
                              │ - commit JSON   │
                              └─────────────────┘
```

### 8.2 Stack

**Frontend (`/web`):**
- Next.js 14 (App Router), TypeScript.
- Tailwind CSS untuk styling.
- shadcn/ui untuk komponen dasar (button, dialog, tabs, table).
- Recharts untuk plot timeline dan bar charts.
- Plotly.js untuk plot residual, QQ, distribusi (lebih fleksibel untuk statistical plots).
- next-intl atau next-i18next untuk toggle bahasa.

**Backend inferensi (`/api`):**
- FastAPI (Python 3.11).
- xgboost, tensorflow/keras, scikit-learn, joblib untuk loading model & scaler.
- pandas, numpy untuk pra-pemrosesan.
- yfinance untuk pengambilan data.

**Data pipeline (`/ml-pipeline`):**
- Script Python yang dipakai bersama oleh FastAPI (untuk inferensi on-demand bila perlu) dan GitHub Actions (untuk batch harian).
- Modul pra-pemrosesan **harus reuse kode dari notebook 02** — ekstrak ke modul `preprocessing.py` yang juga di-import oleh notebook.

**Otomasi:**
- GitHub Actions cron daily (jadwal 06:00 WIB → 23:00 UTC).
- Manual trigger via `workflow_dispatch`.

**Deployment:**
- Vercel untuk Next.js (gratis, otomatis dari push ke main).
- Railway atau Render untuk FastAPI (free tier; alternatif: Fly.io). Bila FastAPI terlalu berat di-host, fallback: precompute semua di GitHub Actions dan serve JSON statis dari Vercel (zero backend, lebih simple — pertimbangkan).

### 8.3 Keputusan arsitektur kunci

**Apakah butuh FastAPI?** Ada dua opsi:

- **Opsi A: FastAPI online**. Pengguna bisa request inferensi pada data sembarang (skenario lanjutan). Tapi memerlukan host backend yang selalu hidup, biaya jangka panjang, kompleksitas deploy.
- **Opsi B: Inferensi precompute di Actions, JSON statis**. Semua hasil 2024–2025 dan 2026 sejauh ini di-precompute. Web hanya baca JSON. Tidak ada backend. Lebih murah, lebih stabil, cocok dengan scope kita.

**Rekomendasi: Opsi B.** FastAPI tidak diperlukan kalau tujuannya hanya menampilkan hasil precomputed. Memberi "FastAPI" yang menerima request tapi tidak melayani inferensi runtime hanya menambah kompleksitas tanpa nilai.

**Revisi arsitektur:**

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                    │
│  /web                /ml-pipeline      /data/*.json     │
└─────────────────────────────────────────────────────────┘
         │                                    ▲
         │ deploy on push                     │ commit daily
         ▼                                    │
┌─────────────────┐                  ┌────────┴────────┐
│ Vercel          │ ◄──reads JSON────┤ GitHub Actions  │
│ (Next.js)       │                  │ daily cron      │
└─────────────────┘                  └─────────────────┘
```

Inilah arsitektur yang akan kita pakai. **Hapus FastAPI dari scope.** Bila di kemudian hari Anda ingin menambahkan inferensi on-demand interaktif, bisa ditambahkan sebagai fase 2.

### 8.4 Model data

**File: `/data/test_set_2024_2025.json`** (precompute sekali, tidak berubah)

```typescript
{
  generatedAt: string,
  predictions: Array<{
    observationDate: string,  // YYYY-MM-DD
    targetDate: string,
    actual: number,
    predArimax: number,
    predXgboost: number,
    predLstm: number,
    errArimax: number,
    errXgboost: number,
    errLstm: number
  }>,
  metrics: {
    arimax: { mae: number, rmse: number, da: number },
    xgboost: { mae: number, rmse: number, da: number },
    lstm: { mae: number, rmse: number, da: number },
    zeroBenchmark: { mae: number, rmse: number, da: number },
    persistenceBenchmark: { mae: number, rmse: number, da: number }
  },
  significanceTests: Array<{
    comparison: string,
    lossDifferential: number,
    dmStat: number,
    dmPvalue: number,
    wilcoxonPvalue: number,
    verdict: string
  }>,
  residualStats: { ... },
  ablationResults: Array<{ ... }>
}
```

**File: `/data/oos_2026.json`** (di-update harian)

```typescript
{
  lastUpdated: string,         // ISO timestamp UTC
  dataAsOf: string,            // tanggal terakhir data emas tersedia
  predictions: Array<{
    observationDate: string,
    targetDate: string,
    actual: number | null,     // null bila horizon belum lewat
    predXgboost: number,
    predLstm: number,
    errXgboost: number | null,
    errLstm: number | null
  }>,
  aggregateMetrics: {           // hanya untuk prediksi dengan actual !== null
    nObservations: number,
    xgboost: { mae: number, rmse: number, da: number },
    lstm: { mae: number, rmse: number, da: number }
  }
}
```

### 8.5 Pipeline harian — alur detail

1. **Trigger**: cron `0 23 * * *` UTC (jam 06:00 WIB), atau manual via `workflow_dispatch`.
2. **Checkout** repo.
3. **Setup Python** 3.11, install dependencies dari `requirements.txt` dengan versi pinned.
4. **Load model artifacts** dari `/models/`.
5. **Pull data Yahoo Finance** untuk 30 hari terakhir (buffer untuk window LSTM dan lag XGBoost).
6. **Validate data**: cek tidak ada NaN tak terduga, kolom lengkap, tanggal terbaru sesuai ekspektasi (toleransi 1 hari kerja).
7. **Pra-pemrosesan**: terapkan transformasi identik notebook 02 (return harian, perubahan yield, level VIX, alignment kalender).
8. **Bentuk fitur per model**: XGBoost (lag 1–7 dari core features, paket NO_G3); LSTM (sequence window 7, scaling pakai scaler yang sudah di-fit, paket NO_G3).
9. **Inferensi**: untuk setiap tanggal observasi sejak 2026-01-02 sampai tanggal terbaru, hitung prediksi 5-hari.
10. **Update aktual**: untuk prediksi yang horizonnya sudah lewat dan belum punya aktual, isi dengan return kumulatif sebenarnya.
11. **Hitung metrik agregat** untuk subset dengan actual non-null.
12. **Tulis `/data/oos_2026.json`**.
13. **Diff check**: bila tidak ada perubahan substantif, skip commit (hindari noise).
14. **Commit dan push** ke main branch.
15. **Vercel auto-redeploy**.
16. **Bila gagal di langkah manapun**: GitHub Actions kirim email notifikasi via default settings; status workflow ditandai merah.

### 8.6 Mitigasi kegagalan pipeline

| Risiko | Mitigasi |
|---|---|
| `yfinance` ganti API | Versi pinned. Manual update saat ada breaking change. Wrapper class isolate library call. |
| Yahoo rate limit | Retry dengan backoff 3 kali, max 60 detik per attempt. |
| Data hari libur kosong | Skip insert; pertahankan data terakhir; log warning. |
| Workflow gagal | Email notifikasi default GitHub. Manual trigger sebagai fallback. |
| Data basi >7 hari | Banner merah di web dengan tanggal terakhir update. |
| **Hari sidang** | H-1 sidang: jalankan manual trigger, verifikasi data update, commit dan push. Bila cron pecah di hari-H, web tetap menampilkan data H-1. |

---

## 9. Disclaimer dan Compliance Akademis

Setiap halaman menampilkan disclaimer:

> *"GoldSight adalah luaran akademis dari penelitian skripsi. Hasil prediksi yang ditampilkan **tidak dimaksudkan sebagai rekomendasi investasi**, sinyal trading, atau bentuk bantuan pengambilan keputusan finansial. Penelitian ini menyimpulkan bahwa prediksi return emas lima hari ke depan merupakan permasalahan sulit dengan perbaikan terbatas atas benchmark sederhana."*

Halaman 5 menampilkan versi panjang yang merujuk Bab 4.3 dan kesimpulan Bab V skripsi.

---

## 10. Integrasi ke Skripsi

| Lokasi | Konten |
|---|---|
| Abstrak | Satu kalimat tambahan: implementasi dashboard interaktif sebagai luaran. |
| Bab I, 1.5 Metode Penelitian | Tambah poin 8: "Implementasi Sistem Dashboard". |
| Bab III, subbab baru 3.2.7 | Implementasi Dashboard dan Pipeline Otomasi (~1 halaman): stack, arsitektur, format data, frekuensi update, mitigasi kegagalan. |
| Bab IV, subbab baru 4.4 | Implementasi Dashboard (ringkas, ~1 halaman): screenshot fitur kunci, walkthrough. |
| Bab IV, subbab baru 4.5 | Analisis Lanjutan dan Validasi Out-of-Sample (~3–4 halaman): (a) breakdown analitis baru pada 2024–2025 dari fitur dashboard, (b) pengamatan empiris 2026 dengan caveat sampel kecil. |
| Bab V, Kontribusi | Tambah butir: implementasi dashboard dan validasi empiris out-of-sample. |
| Bab V, Saran | Tambah butir: pemantauan jangka panjang pada periode pasca-evaluasi sebagai pengembangan. |

---

## 11. Timeline dan Milestone

Asumsi: **8 minggu efektif** (rentang menengah). Bila lebih pendek, lihat *de-scoping plan* di bagian 14.

| Minggu | Milestone | Deliverable |
|---|---|---|
| 1 | Setup repo, ekstrak model artifacts dari notebook | `/models/` siap, `preprocessing.py` modular |
| 1 | Precompute `test_set_2024_2025.json` dari hasil penelitian | File JSON committed |
| 2 | Setup Next.js, layout dasar, halaman Beranda | Halaman 1 functional dengan data dummy |
| 2 | Halaman 2 (2024–2025) skeleton dengan timeline dan drill-down | Plot Recharts working |
| 3 | Halaman 2 komponen analisis (residual, QQ, distribusi, direction) | Plotly plots rendering |
| 3 | Halaman 2 breakdown analitis (insight baru) | Heatmap, breakdown per quartile |
| 4 | Pipeline `/ml-pipeline/` standalone bekerja lokal | Script Python berjalan, output JSON benar |
| 4 | Halaman 3 (Replay 2026) skeleton + paritas visual dengan H2 | Komponen pakai data sample dummy |
| 5 | GitHub Actions cron setup, manual trigger berfungsi | Workflow committing daily |
| 5 | Halaman 4 (Studi Ablasi) | Interactive table + bar chart |
| 6 | Halaman 5 (Tentang/Keterbatasan), toggle bahasa | Full i18n untuk semua teks |
| 6 | Disclaimer dan banner status, error boundaries | UX polish |
| 7 | Cross-browser testing, performance optimization, accessibility audit | Lighthouse ≥90 |
| 7 | Deploy production, custom domain (opsional) | URL stabil |
| 8 | Buffer, dokumentasi README, screenshot untuk skripsi | Bab IV 4.4 ready |

**Pre-sidang (H-1):** Jalankan manual trigger pipeline, verifikasi data fresh, frozen state.

---

## 12. Acceptance Criteria

Sebelum dinyatakan selesai, GoldSight memenuhi:

- [ ] Semua 5 halaman dapat diakses dan menampilkan konten yang benar.
- [ ] Toggle bahasa berfungsi pada semua halaman, semua teks ter-translate.
- [ ] Plot interaktif (timeline, drill-down, residual, QQ) render correctly di Chrome, Firefox, Safari versi terbaru.
- [ ] Pipeline cron berhasil dijalankan minimal 7 hari berturut-turut tanpa intervensi.
- [ ] Manual trigger pipeline dapat dijalankan dan menyelesaikan dalam <5 menit.
- [ ] Tanggal "terakhir update" yang ditampilkan akurat dan reflek state data.
- [ ] Banner status merah/kuning/hijau berfungsi sesuai threshold.
- [ ] Disclaimer akademis tampil di setiap halaman.
- [ ] Tidak ada console error pada production build.
- [ ] Lighthouse score ≥90 untuk Performance dan Accessibility pada halaman utama.
- [ ] Subbab 3.2.7, 4.4, dan 4.5 di skripsi telah ditulis dan terintegrasi.

---

## 13. Risiko dan Mitigasi

| Risiko | Dampak | Probabilitas | Mitigasi |
|---|---|---|---|
| Pipeline gagal di hari sidang | Sedang | Rendah | Frozen snapshot H-1, fallback graceful, manual trigger |
| Yahoo Finance breaking change | Tinggi | Rendah-sedang | Versi pinned, wrapper class, monitoring email |
| Performance LSTM inferensi lambat di Actions | Sedang | Rendah | Batch inference, GitHub Actions punya runner 7GB cukup |
| Scope creep menambah fitur | Tinggi | Sedang | PRD ini sebagai kontrak; tambahan masuk Phase 2 |
| Model artifacts korup / tidak konsisten dengan notebook | Tinggi | Rendah | Validasi reproduksi prediksi test set sebagai unit test di pipeline |
| Vercel free tier limit terlampaui | Rendah | Sangat rendah | Aplikasi statis tanpa SSR berat |

---

## 14. De-scoping Plan (Bila Waktu Lebih Pendek)

Bila Anda menyadari waktu hanya 4–6 minggu, prune dalam urutan ini:

1. **Hapus toggle bahasa** — kerjakan Indonesia saja, tambah English bila sempat. (Hemat ~3–4 hari)
2. **Hapus halaman Studi Ablasi sebagai halaman terpisah** — pindahkan ke section di halaman Beranda. (Hemat ~2 hari)
3. **Sederhanakan breakdown analitis** — pertahankan timeline & drill-down, hapus heatmap. (Hemat ~2 hari)
4. **Hapus cron, ganti manual trigger saja** — Anda jalankan pipeline manual seminggu sekali. (Hemat ~2 hari)
5. **Stack ke Streamlit** — keputusan radikal, tapi memotong waktu 50%+. Hanya bila benar-benar mepet (<4 minggu).

---

## 15. Phase 2 (Pasca-Sidang, Opsional)

Tidak dalam scope sidang, tapi ide pengembangan:

- Inferensi on-demand untuk tanggal sembarang (perlu FastAPI online).
- Perbandingan dengan model baseline tambahan (random walk, SMA).
- Notifikasi RSS/email saat update.
- API publik untuk akses data prediksi.
- Ekstensi ke aset lain (silver, oil) dengan model serupa.

---

*Dokumen ini bersifat hidup. Revisi dilakukan via pull request ke repo dengan changelog yang jelas.*
