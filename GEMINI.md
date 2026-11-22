# 📋 Attendance & Operations Management (Mobile & Backend)
> **Konteks Proyek & Aturan Tetap untuk Antigravity AI**  
> Terakhir diperbarui: 22 November 2026

Dokumen ini berisi seluruh ringkasan arsitektur, basis data, aturan bisnis, dan fitur yang telah diimplementasikan. File ini dibaca otomatis di setiap room baru untuk menghemat token dan menjaga konsistensi kode.

---

## 1. Arsitektur Proyek & Lingkungan

* **Aplikasi Mobile** (`attendance-management-mobile`):
  - Stack: Ionic 8 + Angular 19 + TypeScript + Capacitor (Android/Web).
  - Branch Git: `main` (Push ke `origin main`).
* **Backend API** (`attendance-management`):
  - Stack: Laravel 11 + PHP 8.2 + MySQL.
  - Server Production: cPanel VPS `[resdigaz@bekantan attendance.eskristalkarawang.com]`.
  - Branch Git: `develop` (Push ke `origin develop`, lalu `git pull origin develop` di server).

---

## 2. Aturan Penting Database Ganda & SSO Multi-Tenant

1. **Koneksi `mysql` (Lokal Absensi)**:
   - Tabel: `form_submissions`, `forms`, `form_schedules`, `form_answers`, `deliveries`, `attendances`, `shifts`, `vehicles`.
2. **Koneksi `buku_digital` (Pusat SSO)**:
   - Tabel: `users`, `roles`, `branches`.
   - Scope Multi-Tenant: `BUKU_DIGITAL_BUSINESS_ID=10`.
3. ⚠️ **ATURAN MUTLAK QUERY SILANG DATABASE**:
   - Model `User` terhubung ke koneksi `buku_digital`.
   - Model `FormSubmission` & `Delivery` terhubung ke koneksi `mysql`.
   - **DILARANG KERAS** menggunakan `whereHas('user', ...)` pada model lokal, karena Laravel akan menjalankan SQL `EXISTS` pada koneksi `mysql` dan menyebabkan crash: `Unknown column 'business_id' in 'WHERE'`.
   - **Solusi Benar**: Query `User` terlebih dahulu untuk mengambil ID, lalu gunakan `whereIn('user_id', $userIds)` pada model lokal:
     ```php
     $userIds = \App\Models\User::where('name', 'LIKE', '%dika%')->pluck('id');
     $subs = \App\Models\FormSubmission::whereIn('user_id', $userIds)->get();
     ```

---

## 3. Aturan Bisnis & Logika Peran (Roles)

### A. Driver (Kurir Pengiriman)
* **Pengiriman Multi-Varian Bal**:
  - Kolom DB: `qty_20kg`, `qty_15kg`, `qty_10kg`, `qty_5kg`.
  - Total Bal = $\text{qty\_20kg} + \text{qty\_15kg} + \text{qty\_10kg} + \text{qty\_5kg}$.
  - Seluruh varian (termasuk 10kg, 15kg, 5kg) **masuk hitungan target ritase harian**.
  - Target ritase: **20 bal** (shift reguler) / **13 bal** (helper rangkap).
* **Input Manual Pengiriman (`bulk-delivery`)**:
  - Driver bisa input mandiri jika nota POS belum ada (`input_mode: 'manual'`).
  - Status awal `pending` menunggu persetujuan KO.
* **Foto Kartu Nama & Bukti Pengiriman**:
  - Driver bisa memilih **Kamera** atau **Galeri HP**.
  - **Validasi EXIF Usia Foto**: Jika foto galeri berumur **> 7 hari**, sistem otomatis menolak foto demi mencegah kecurangan bukti usang. Foto tanpa EXIF (unduhan WA) diizinkan dengan notifikasi tanggal hari ini.
* **Gatekeeper Pulang**:
  - Driver tidak bisa absen pulang jika target ritase belum tercapai, kecuali diberi **Bypass Checkout** oleh KO (`checkout_bypass_approved`).

---

### B. KO / Kasir (Kepala Operasional)
* **Deteksi Shift Dinamis & Aturan Checksheet**:
  - Presensi check-in $< 08:00$ WIB $\rightarrow$ **Shift Pagi** (Fase aktif: Pagi, Siang, Sore).
  - Presensi check-in $\ge 08:00$ WIB (misal 13:00 WIB) $\rightarrow$ **Shift Siang** (Fase aktif: Siang, Sore, Malam).
  - Slot Fase Pagi (seperti "Presensi & Buka Depot Pagi") otomatis **`Dilewati (Shift)` / `Exempt`** untuk KO Shift Siang tanpa penalti nilai KPI.
* **Presensi & Buka Depot Pagi**:
  - Bersifat otomatis (`auto_source: attendance_checkin`). Otomatis `Done` saat KO check-in masuk via GPS + selfie (bukan formulir manual).
* **Rekonsiliasi Kas Laci (Closing POS)**:
  - Dihitung **murni per user kasir (`created_by`)**, mencocokkan angka **`SALDO KAS LACI (FISIK)`** di POS Buku Digital masing-masing kasir (tidak digabung antar-kasir).
* **Approval Pengiriman Driver (Single Container per Driver)**:
  - Halaman `ko-deliveries` mengelompokkan pengiriman per driver agar rapi.
  - Ringkasan container: Nama Driver, Armada, Badge Pending/Approved, Total Bal per Varian, Total Setoran Kasir.
  - **Tombol "Rincian Toko"**: Membuka modal detail toko untuk melihat foto kartu nama dan pembayaran.
  - **Tombol "Approve Semua (X)"**: Batch approval 1 klik melalui `POST /api/v1/ko/deliveries/approve-driver-batch`.
* **Notifikasi Suara Live**:
  - Halaman checksheet KO memiliki audio chime + toast alert saat driver mengunggah inspeksi motor baru.

---

## 4. Alur Kerja & Deploy Standar

* **Jika ada perubahan Backend**:
  ```bash
  # Di server:
  cd /home/resdigaz/attendance.eskristalkarawang.com
  git pull origin develop
  php artisan route:clear
  php artisan cache:clear
  ```
* **Jika ada perubahan Mobile**:
  - Pastikan `npm run build` berhasil tanpa error TypeScript / Angular.
  - Push ke branch `main`.
