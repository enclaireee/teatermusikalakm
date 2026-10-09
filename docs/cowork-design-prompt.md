# Tugas: Lanjutkan desain website tiket "Musikal Aku, Kau & Musik" di Figma

Kamu desainer UI/UX. Lanjutkan pekerjaan desain yang sudah setengah jalan di file Figma ini:
https://www.figma.com/design/k7BKLmsrAqi12Z9aIWK67B/Musikal-Aku--Kau---Musik

Kerjakan HANYA di page **"website"**. Jangan ubah atau hapus apa pun di page lain (DESIGN, ARTISTIC). Kalau ada yang ambigu, tanya aku dulu. Jangan menebak.

## 1. Yang sudah ada di page "website" (pakai ulang, jangan dibuat ulang)

Section **"00 · Design System"** berisi:

**Variables**
- **Collection "Variable collection" (sudah ada dari awal):** Hijau `#007C38`, Kuning `#FAF015`, Merah `#C10000`, Item `#404040`, Abu `#DCDCDC`.
- **AKM Primitives (tersembunyi):** hijau-tua, hijau-muda, merah-tua, merah-muda, kuning-tua, kuning-muda, putih, kertas `#F7F5EE`, hitam `#141414`, abu-muda, abu-tua, seat-tipe1 `#8FD9A8` (hijau), seat-vip `#FFF27A` (kuning), seat-tipe2 `#8EC5F5` (biru), seat-tipe3 `#F59FC4` (pink), seat-tipe4 `#C3A6F2` (ungu), stage `#F4A3A3`.
- **AKM Color (semantic, alias ke primitives dan warna brand):**
  - `color/bg/*`: page, surface, muted, brand, brand-strong, brand-soft, accent, accent-strong, accent-soft, danger, danger-strong, danger-soft, disabled, inverse
  - `color/text/*`: primary, strong, secondary, brand, accent, danger, on-brand, on-accent, disabled
  - `color/border/*`: default, subtle, brand, focus, danger, accent
  - `color/seat/*`: tipe1–4, vip, selected, taken, stage
- **AKM Dimension:** `space/0,4,8,12,16,20,24,32,40,48,64,80,96,128`, `radius/sm 6, md 12, lg 20, xl 32, full`, `stroke/thin 1, default 2, bold 3`.

**Styles**
- **Text styles:** Display/XL, Display/L, Heading/H1–H4 (Kirang Haerang), Body/L, Body/M, Body/S, Label/Button, Label/M, Caption.
  - Font body seharusnya **Bootzy TM**, tapi belum terpasang di Mac ini. Untuk sementara text style body memakai **Plus Jakarta Sans SemiBold**. Begitu Bootzy TM terpasang, cukup ganti font di text style body.
- **Effect styles:**
  - Shadow/Sticker: offset 4px, tanpa blur, warna #404040
  - Shadow/Sticker-L: offset 8px
  - Shadow/Soft
  - Focus/Ring: gap putih 3px + ring hijau 6px

**Komponen**
- 29 ikon `Icon/*` (gaya Lucide, stroke 2): check, x, lock, chevron, arrow, calendar, clock, map-pin, ticket, upload, download, copy, qr-code, bank, info, alert-circle, check-circle, loader, menu, mail, user, phone, instagram, music, file, users, key.
- **Button:** Variant Primary/Accent/Secondary/Ghost × State Default/Hover/Focus/Disabled/Loading. Properti Label dan Show icon.
- **Field:** State Default/Hover/Focus/Filled/Error/Disabled. Properti Label, Value, Helper, Required, Show helper.
- **Seat:** Tier Tipe 1–4 × Available/Hover/Selected/Taken, ditambah VIP × Locked/Available/Hover/Selected/Taken. Ukuran 20px.
- **Seat Legend:** Tipe 1–4, VIP, Dipilih, Terisi.

Opsional: ada plugin lokal di repo `figma-plugin/` (`manifest.json` + `code.js`) yang bisa membangun sisanya otomatis lewat Plugins → Development → Import plugin from manifest. Plugin ini belum pernah dijalankan. Boleh dipakai, dicek, atau diabaikan.

## 2. Identitas visual (sumber: seluruh post di page DESIGN)

- **Warna:** hijau `#007C38` (latar utama), kuning `#FAF015` (aksen), merah `#C10000` (tirai, judul, stempel), item `#404040`, abu `#DCDCDC`.
- **Font:** Kirang Haerang untuk heading, Bootzy TM untuk body (letter spacing 3%).
- **Tekstur:** kertas, graph paper, corkboard, chalkboard.
- **Elemen grafis:** tirai merah panggung berbentuk scallop, papan marquee dengan lampu kuning, ledakan bintang kuning, stempel merah (CONFIRMED, APPROVED), polaroid dan selotip, sticky note, label hijau miring.
- **Gaya:** outline tebal ala stiker dengan bayangan offset tanpa blur. Tone santai khas anak muda ("gas ngeng merapat!").
- **Referensi di page DESIGN:** Stylescape AKM (`492:6859`), Announcement AKM (`1051:2`), SEATING PLAN (`1111:541`), TANDA TERIMA (`872:153`), Logo AKM (`117:2749`; image fill hash `ffd5a8f97ff38c1218ad95a30170c8aac730136d`).

## 3. Konten acara

- **Nama acara:** Teater Musikal *Aku, Kau & Musik*. Presented by Juzzer × Stage Universitas Indonesia, di bawah supervisi Jakarta Movin.
- **Tema:** "Harmoni Asa dan Musik". Ceritanya tentang perjuangan mahasiswa meraih beasiswa penuh di tengah beban UKT.
- **Jadwal:** Kamis, 29 Oktober 2026, di Makara Art Center UI, Depok. Show 1 pukul 15.00–17.00 WIB, Show 2 pukul 19.00–21.00 WIB.
- **Cast:**
  - Main cast: Albian Athaya Putra (Athar), Yokhebed Chelsee Radeyla (Dinda)
  - Ensemble: Nallegra Linggar, Kinara Syahla Naura, Chella Ernawati, M. Putra Januar, Rifano Chandra Kurniawan, Nathaniel Hans Gunawan
- **Kontak:** IG/TikTok @stage.ui, stagepromedui@gmail.com, WA Hana 0859-0001-8942.
- **Visi/misi dan latar belakang:** ambil dari section "Proposal Kegiatan", "Proposal Sponsor" dan "Proposal Medpar" di page DESIGN.

**Denah kursi (400 kursi per show), stage di atas, baris A paling dekat ke stage:**
- **Blok tengah per baris:** A10 B13 C13 D13 E12 F13 G13 H14 I15 J16 K16 L17 M18 N20 O19.
- **Sayap kiri dan kanan per baris (jumlah di tiap sisi):** A–E 6, F–I 7, J–L 6, M–N 5, O 3.
- **Penomoran:** dari kanan ke kiri. Kursi paling kanan di sayap kanan bernomor 1, kursi paling kiri di sayap kiri bernomor terakhir. Contoh baris C: sayap kanan C1–C6, tengah C7–C19, sayap kiri C20–C25.
- **Kategori:**
  - Tipe 1 (hijau): tengah baris A–D & G
  - VIP (kuning): tengah baris E–F
  - Tipe 2 (biru): tengah baris H–O
  - Tipe 3 (pink): sayap baris A–G
  - Tipe 4 (ungu): sayap baris H–O

## 4. Keputusan yang sudah final

- **Struktur halaman:** hanya **Landing + About Us**. Landing dibuat singkat, isinya 2 kartu show (Show 1 / Show 2) yang langsung mengarah ke pendaftaran.
- **Alur checkout:** Data Diri → Pilih Kursi → Pembayaran → Sukses/Download E-Receipt.
- **Harga:** pakai placeholder "Rp XX.XXX".
- **Batas pembelian:** maksimal 4 tiket per transaksi.
- **Data diri:** cukup data pemesan, yaitu nama, email, no. WhatsApp, dan asal instansi (opsional). Satu e-receipt untuk semua kursi.
- **Kursi VIP:** terkunci, dan hanya bisa dibuka lewat **kode undangan** (pakai modal).
- **Pembayaran:** QRIS dan transfer bank, keduanya dengan upload bukti, lalu diverifikasi manual (maks. 1×24 jam). Kursi ditahan 10 menit dan ditampilkan countdown.
- **Versi layar:** desktop (1440) dan mobile (390).

## 5. Pola UX acuan

- Satu CTA primer per layar, lengkap dengan state loading dan disabled.
- Stepper 4 langkah di setiap halaman checkout.
- Ringkasan pesanan sticky: sidebar di desktop, bottom bar di mobile.
- Form satu kolom, label di atas input, error spesifik di bawah field.
- Seat map dengan legenda, tombol lanjut nonaktif sampai kursi dipilih, dan tooltip saat hover.
- Metode pembayaran berupa radio card.
- Halaman sukses menampilkan kode booking yang menonjol dan tombol Download sebagai CTA utama.
- Desain e-receipt bergaya tiket: perforasi, QR, stempel.

## 6. Yang perlu dikerjakan

1. **Komponen yang belum ada:** Step/Stepper (desktop dan mobile), Alert (Info/Success/Warning/Error), Payment Option, Upload (Default/Hover/Uploading/Uploaded/Error), Checkbox, Quantity (1–4), Stamp, Tier Card, Show Card (Default/Hover/Sold Out), Order Summary, Bottom Bar mobile, Navbar, Footer, serta papan Foundations.
2. **Layar desktop dan mobile:**
   - Landing
   - About Us
   - Data Diri (default dan error)
   - Pilih Kursi (dengan seat map lengkap dan state available/selected/taken/locked)
   - Modal kode undangan
   - Pembayaran QRIS
   - Pembayaran Transfer
   - Sukses & Download E-Receipt
3. **Desain e-receipt:** ukuran A4 untuk PDF.

**Ketentuan:**
- Pakai auto layout, instance komponen, dan variables/styles. Jangan pakai nilai hardcode.
- Nama layer rapi. Satu frame per halaman per device, disusun berurutan di canvas: section "01 · Desktop Flow", "02 · Mobile Flow", "03 · E-Receipt".
- Sertakan state penting: default, hover/focus, error, disabled, loading.

## 7. Setelah selesai: STOP

Jangan mulai implementasi kode. Kirim ringkasan ke aku yang berisi:
- daftar halaman/frame beserta link node Figma-nya,
- asumsi yang kamu ambil,
- pertanyaan yang tersisa.

Tunggu verifikasi dariku, lalu revisi sampai aku bilang disetujui.
