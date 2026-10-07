# Buku Besar — Money Management (Frontend Portfolio Version)

Dashboard keuangan pribadi berbahasa Indonesia: catat pemasukan, pengeluaran, dan
transfer; pantau saldo setiap akun; atur budget bulanan per kategori; kelola hutang
dan piutang; atur transaksi berulang; baca analitik arus kas.

Ini adalah **versi portofolio yang sepenuhnya frontend-only** — tidak ada server, tidak
ada database, tidak ada Google Sheets, tidak ada API eksternal, tidak ada autentikasi
sungguhan. Seluruh data adalah **contoh buatan** yang disimpan di localStorage
browser, dan seluruh "endpoint" diimplementasikan ulang sebagai router mock di dalam
browser. Lihat [PRODUCT.md](./PRODUCT.md) untuk batas produk dan
[DESIGN.md](./DESIGN.md) untuk sistem desain "Buku Besar".

## Fitur utama

- **Ringkasan (dashboard)** — kartu total saldo/pemasukan/pengeluaran/arus kas, ringkasan
  hari & minggu ini, tren 6 bulan, breakdown pengeluaran per kategori, transaksi terbaru.
- **Transaksi** — pencarian, filter (rentang, tipe, kategori, akun), sorting, pagination;
  tambah/ubah/hapus; transfer antar akun sendiri; pemindaian struk (OCR di browser
  via Tesseract.js) yang mengisi form otomatis.
- **Anggaran** — navigasi bulan, status Safe/Warning/Critical/Over Budget, tambah/ubah/hapus.
- **Akun** — saldo per akun yang dihitung dari transaksi, aktif/nonaktif, guard hapus
  saat akun masih dipakai transaksi.
- **Kategori** — tipe Income/Expense, aktif/nonaktif, guard hapus saat masih dipakai
  transaksi, budget, atau jadwal berulang.
- **Utang & Piutang** — status turunan (Pending/Partially Paid/Paid/Overdue), pembayaran
  parsial, ubah/hapus.
- **Berulang** — jadwal Daily/Weekly/Monthly/Yearly dengan tanggal mulai/selesai,
  generate manual per jadwal dan generate massal yang jatuh tempo.
- **Pengaturan** — status penyimpanan demo (browser/memory), hitung baris per bagian,
  **reset data demo**, default akun/kategori, keluar.

## Tech stack

- Next.js 14 (App Router) + React 18 + TypeScript 5
- Tailwind CSS 3.4
- Recharts 3 (grafik dashboard)
- Zod 4 (validasi payload mock)
- Tesseract.js 7 (OCR struk, murni client-side)

Tidak ada dependensi backend: tidak ada `googleapis`, `jose`, `bcryptjs`, `server-only`.

## Cara menjalankan

Butuh Node.js 18+.

```bash
npm install
npm run dev     # http://localhost:3000
```

Perintah lain:

```bash
npm run build   # build produksi (14 halaman statis, tanpa route API)
npm run start   # jalankan hasil build
npm run typecheck  # tsc --noEmit
npm run lint
```

Tidak ada `.env`, tidak ada kredensial, tidak ada konfigurasi apa pun. Halaman `/login`
menerima kata sandi apa pun — itu simulasi UI, bukan autentikasi. Penjaga rute-nya ikut
dipindah ke klien: `AppShell` mengarahkan ke `/login?next=…` selama sesi demo (di
localStorage) belum ada, lalu mengembalikan ke halaman yang dituju setelah masuk.

## Struktur proyek

```text
src/
  app/
    (app)/            # dashboard, transactions, budgets, accounts, categories, debts, recurring, settings
    (auth)/login/     # halaman masuk demo
  components/         # layout (AppShell, Sidebar), ui primitif, komponen per domain
  config/site.ts      # nama app + navigasi
  lib/
    api.ts            # transport: meneruskan ke mockRequest (bukan fetch)
    client/use-api.ts # hook GET: mockRequest + subscribe perubahan dataset
    client/range.ts   # helper rentang waktu dashboard
    calculations/finance.ts  # murni: saldo, arus kas, budget, utang, jadwal
    currency.ts       # formatIDR / parseIDR
    format-date.ts    # tanggal/bulan ISO, batas bulan/minggu
    errors.ts         # string error Indonesia + AppError
    validations/      # skema zod per domain
    receipt/parse.ts  # parser hasil OCR struk
    mock/
      seed.ts         # generator dataset contoh (seeded RNG, 9 bulan histori)
      store.ts        # singleton dataset + persist localStorage + sesi demo
      routes.ts       # implementasi 15+ endpoint + auth demo + status/reset
      types.ts        # DemoDataset / DemoSession
      ledger.ts       # filter/sort transaksi, resolusi akun, status utang
      error.ts        # MockHttpError
  types/              # Transaction, Account, Category, Budget, Debt, Recurring
```

### Bagaimana mock backend bekerja

Halaman dan komponen tidak diubah: mereka tetap memanggil `/api/*` lewat `apiFetch`
dan `useApi` seperti versi aslinya. Yang berubah hanya transportnya — `src/lib/api.ts`
dan `src/lib/client/use-api.ts` meneruskan setiap panggilan ke `mockRequest()` di
`src/lib/mock/routes.ts`, yang mengimplementasikan kontrak payload yang sama
(pagination, `balances`, `spent`, `summary`, `buckets`) di atas dataset contoh.

Dataset dibuat oleh `buildSeedDataset()` dari seed tetap: 6 akun, 17+2 kategori,
ratusan transaksi selama 9 bulan (gaji tiap tanggal 1 agar bulan berjalan selalu ada
pemasukan), budget 2 bulan, 7 catatan utang/piutang, 8 jadwal berulang. Tulis pertama
kali disimpan ke `localStorage` (`pfm.demo.dataset`); setiap mutasi (tambah/ubah/hapus)
disimpan otomatis dan bertahan setelah reload. Tombol **Reset data demo** di Pengaturan
mencetak ulang dari seed.

## Catatan portofolio

- Seluruh nama, nominal, dan tanggal adalah contoh buatan — tidak ada data pribadi.
- Login/logout hanya simulasi sesi demo di browser.
- Scan struk berjalan 100% di browser (Tesseract.js + preprocessing canvas); tidak ada
  file yang diunggah ke mana pun.
