# Modul AI & Upload BodyGoal

## Gambaran Umum

Modul ini mengimplementasikan fitur utama untuk proyek BodyGoal yang berfokus pada pemrosesan permintaan pengguna menggunakan AI dan penanganan upload gambar. Modul ini dirancang untuk diintegrasikan dengan bagian lain dalam repositori GitHub yang sama.

---

## Fitur

### 1. AI Plan Generator (Simulasi)

- **Endpoint:** `POST /api/ai-plan` (diimplementasikan sebagai server action Next.js)
- **Input:**
  - `beratAwal` (number): Berat awal dalam kg
  - `beratTarget` (number): Berat target dalam kg
  - `durasiMinggu` (number): Durasi dalam minggu
  - `goal` (string): Salah satu dari `cutting`, `bulking`, atau `maintain`
- **Output:**
  - `dailyCalories` (number): Rekomendasi kalori harian
  - `workoutStyle` (string): Gaya latihan yang disarankan
  - `mealType` (string): Jenis makanan yang disarankan

- **Lokasi:**
  - Server action: `src/app/action/ai-plan/route.js`
  - Halaman client untuk testing: `src/app/ai-plan/page.js`
  - Halaman testing lengkap: `src/app/test/page.js`

---

### 2. Upload Gambar (Simulasi)

- **Endpoint:** `POST /api/upload-photo` (server action Next.js)
- **Fungsi:** Mensimulasikan upload gambar dengan mengembalikan URL dummy (sebagai placeholder untuk integrasi Cloudflare R2)
- **Lokasi:**
  - Server action: `src/app/action/upload-photo/route.js`
  - Tombol testing pada halaman lengkap: `src/app/test/page.js`

---

### 3. Fungsi Bantu

- `calculateCalories(bmr, activityLevel, goal)` - Menghitung kebutuhan kalori berdasarkan BMR, aktivitas, dan tujuan.
- `evaluateBadge(todayWeight, prevWeight)` - Mengevaluasi badge progres mingguan.
- `getToday()` - Mengembalikan tanggal hari ini dalam format `YYYY-MM-DD`.

- **Lokasi:** `src/lib/`

---

### 4. Variabel Environment

Buat file `.env.local` di root proyek dengan variabel berikut:

```
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=your_neondb_database_url_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
R2_ACCESS_KEY=your_cloudflare_r2_access_key_here
```

---

### 5. Testing

- Gunakan halaman testing lengkap di `/test` untuk menguji fitur AI Plan, upload gambar, dan AI Coach.
- Jalankan server Next.js dengan perintah:

```bash
npm run dev
# atau
yarn dev
```

- Akses halaman testing di: `http://localhost:3000/test`

---

## Catatan

- Fitur AI Coach menggunakan model GPT-3.5-turbo dari OpenAI dan diimplementasikan di `src/app/action/ai-coach/route.js`.
- Fitur upload gambar saat ini hanya mengembalikan URL dummy dan perlu diintegrasikan dengan Cloudflare R2 untuk upload sebenarnya.
- Fungsi bantu sudah diimplementasikan sebagai ES module untuk konsistensi.

---

## Kontribusi

### 🟥 Ryan – **Bagian AI & Upload (OpenAI + R2 + .env)**

**Fokus: Merespon permintaan user pakai AI + handle upload gambar.**

### Yang sudah dikerjakan:

1. Membuat repository GitHub terbaru untuk modul ini.
2. Mengimplementasikan **AI Plan Generator (simulasi)** dengan endpoint `POST /api/ai-plan` yang menerima input berat awal, target, dan durasi, serta mengeluarkan kalori per hari, gaya latihan, dan jenis makanan.
3. Membuat endpoint **Upload Gambar** `POST /api/upload-photo` yang mensimulasikan upload gambar dan menyimpan URL dummy ke Cloudflare R2.
4. Menyusun file `.env.local` dengan variabel environment penting seperti `OPENAI_API_KEY`, `DATABASE_URL` (NeonDB), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, dan `R2_ACCESS_KEY`.
5. Menambahkan fungsi bantu:
   - Kalkulasi kalori berdasarkan berat dan goal.
   - Evaluasi badge mingguan.
   - Fungsi tanggal hari ini (`getToday()`).

---

## Lisensi

Tentukan lisensi proyek Anda di sini.
