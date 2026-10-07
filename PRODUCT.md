# Product

> **Edisi portofolio (frontend-only).** Dokumen ini adalah deskripsi produk asli. Versi
> di repo ini tidak memakai Google Sheets, server, database, atau autentikasi sungguhan:
> seluruh data adalah contoh buatan yang disimpan di browser, dan autentikasi hanya
> simulasi UI. Lihat [README.md](./README.md).

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Satu pengguna: pemilik aplikasi. Tidak ada multi-user, role, atau pendaftaran publik.
Dibuka terutama dari ponsel untuk mencatat transaksi harian dan mengecek sisa budget;
sesekali dari desktop untuk merapikan data bulanan dan membaca analitik. Di aplikasi
aslinya data yang dipegang adalah keuangan nyata; di edisi portofolio ini seluruh isinya
adalah data contoh.

## Product Purpose

Dashboard keuangan pribadi: mencatat pemasukan, pengeluaran, dan transfer; memantau
saldo setiap akun; mengatur budget bulanan per kategori; mengelola hutang dan piutang;
mengatur transaksi berulang; dan menampilkan analitik arus kas. Sukses berarti pengguna
mencatat transaksi dalam hitungan detik dan selalu tahu posisi keuangannya tanpa
membuka lembar kerja terpisah.

## Positioning

Versi portofolio ini tidak memakai penyimpanan mana pun di luar browser: seluruh
"endpoint" diimplementasikan ulang sebagai router mock di dalam app, dengan dataset
contoh di localStorage yang bisa direset dari halaman Pengaturan. Tujuannya
mempertunjukkan UI, alur, dan analitik tanpa memerlukan server atau kredensial.

## Operating Context

- Akun contoh: Tunai (Cash), BCA/Mandiri/Jenius (Bank), GoPay/OVO (E-Wallet). Tipe akun:
  Cash, Bank, E-Wallet, Other; status Active/Inactive.
- Kategori income: Gaji, Bonus, Freelance, Bunga & Dividen, Lain-lain. Kategori expense:
  Makan & Minum, Transportasi, Belanja Harian, Tagihan & Utilitas, Sewa & Tempat Tinggal,
  Kesehatan, Pendidikan, Hiburan, Pulsa & Internet, Perawatan Diri, Donasi, Lain-lain.
- Mata uang IDR, locale `id-ID`. Seluruh antarmuka berbahasa Indonesia; nilai data
  seperti `Income`/`Expense`/`Transfer` tetap Inggris agar cocok dengan nilai yang dipakai
  perhitungan.
- Dua ritme pemakaian: pencatatan harian cepat (dominan ponsel, satu tangan) dan sesi
  rapi-rapi bulanan (desktop, input massal, review grafik dan budget).
- Saldo dihitung, tidak disimpan: Initial Balance + Income − Expense − Transfer Out +
  Transfer In. Transfer tidak mengubah total kekayaan.
- Dijalankan lokal (`npm run dev` / `npm run start`); halaman masuk hanya simulasi UI.

## Capabilities and Constraints

- Stack terkunci: Next.js 14 App Router + TypeScript + Tailwind CSS + Recharts;
  data contoh di browser via router mock (`src/lib/mock/*`); validasi zod untuk payload
  yang masuk ke router mock.
- Fitur wajib: transaksi tiga tipe (Income/Expense/Transfer) dengan pencarian, filter,
  sorting, dan pagination; transfer menuntut from/to account berbeda; saldo per akun;
  budget bulanan per kategori dengan status Safe/Warning/Critical/Over Budget; hutang &
  piutang dengan pembayaran parsial; transaksi berulang (frekuensi, tanggal mulai/selesai,
  generate manual dan otomatis); analitik (arus kas bersih, pemasukan vs pengeluaran,
  breakdown pengeluaran per kategori, tren pengeluaran); pengaturan default dan logout.
- Nominal disimpan sebagai angka polos (`1000000`); tanggal ISO `YYYY-MM-DD`.
- Di luar MVP: multi-user, role management, pendaftaran publik, integrasi bank, impor
  transaksi otomatis, portofolio investasi, kripto, payment gateway, aplikasi native.
- Aplikasi harus tetap berjalan tanpa library grafik baru di luar Recharts.

## Evidence on Hand

Repo berisi dokumen produk ini, sistem desain (`DESIGN.md`), dan generator seed contoh
di `src/lib/mock/seed.ts` dengan akun/kategori default yang representatif. Tidak ada
testimoni, pelanggan, benchmark, harga, atau lisensi. Tidak ada aset merek: logo, foto,
atau ilustrasi. Jangan mengarang klaim, angka, atau kutipan.

## Product Principles

1. Mencatat harus lebih cepat daripada membuka lembar kerja terpisah.
2. Angka harus bisa dipercaya: saldo dihitung, transfer netral, status budget jujur.
3. Data tetap milik pengguna dan bisa diperiksa manual kapan saja.
4. Padat dan cepat dipindai, tanpa mengorbankan keterbacaan angka.
5. Satu pengguna, nol gesekan: tanpa onboarding, tanpa peran, tanpa kolaborasi.

## Accessibility & Inclusion

Pengguna tidak menyatakan standar khusus. Target kerja sesi ini: kontras teks WCAG AA,
target sentuh nyaman untuk pemakaian satu tangan di ponsel, seluruh kontrol dapat
dicapai keyboard, dan status tidak pernah dikodekan lewat warna saja.
