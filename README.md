# BodyGoal - Fitness Tracking Application

Aplikasi fitness tracking yang dibangun dengan Next.js 15, menggunakan server components dan server actions sesuai dengan fundamental web development modern.

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - React framework dengan App Router
- **React 19** - UI library
- **Tailwind CSS v4** - Utility-first CSS framework
- **Server Components** - Default rendering strategy
- **Server Actions** - Form handling dan data mutations

### Backend
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Database (NeonDB recommended)
- **OpenAI API** - AI coach integration

### Authentication & Storage
- **NextAuth.js** - Authentication (Google OAuth)
- **Cloudflare R2** - File storage (optional)

## 📋 Prerequisites

Sebelum memulai, pastikan Anda memiliki:

1. **Node.js** (v18 atau lebih baru)
2. **npm** atau **bun**
3. **Database PostgreSQL** (NeonDB recommended)
4. **OpenAI API Key** (optional)
5. **Google OAuth credentials** (untuk authentication)
6. **Cloudflare R2** (optional, untuk file upload)

## 🛠️ Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd bodyGoall
```

### 2. Install Dependencies
```bash
npm install
# atau
bun install
```

### 3. Environment Variables
Copy `.env.example` ke `.env` dan isi dengan credentials Anda:

```bash
cp .env.example .env
```

### 4. Database Setup (NeonDB)

1. **Buat akun di [NeonDB](https://neon.tech/)**
2. **Buat database baru**
3. **Copy connection string** ke `DATABASE_URL` di file `.env`
4. **Run Prisma migrations:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

### 5. Google OAuth Setup

1. **Buka [Google Cloud Console](https://console.cloud.google.com/)**
2. **Buat project baru** atau pilih existing project
3. **Enable Google+ API**
4. **Buat OAuth 2.0 credentials:**
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. **Copy Client ID dan Client Secret** ke file `.env`

### 6. OpenAI API Setup (Optional)

1. **Buat akun di [OpenAI](https://platform.openai.com/)**
2. **Generate API key**
3. **Add ke file `.env`**

### 7. Cloudflare R2 Setup (Optional)

1. **Buat akun di [Cloudflare](https://cloudflare.com/)**
2. **Setup R2 bucket**
3. **Generate API tokens**
4. **Add credentials ke file `.env`**

### 8. Run Development Server
```bash
npm run dev
# atau
bun dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📁 Project Structure

```
src/
├── app/                    # App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Dashboard pages
│   ├── action.js          # Server actions
│   ├── layout.js          # Root layout
│   └── page.js            # Home page
├── lib/                   # Utility libraries
│   ├── prisma.js          # Prisma client
│   ├── calculateCalories.js
│   ├── evaluateBadge.js
│   └── getToday.js
└── utils/                 # Utility functions
    └── openai.js          # OpenAI client
```

## 🎯 Key Features

- ✅ **Server-first Architecture** - Menggunakan server components dan server actions
- ✅ **Database Integration** - Prisma ORM dengan PostgreSQL
- ✅ **Progress Tracking** - Weight, meals, dan workout logging
- ✅ **AI Coach** - OpenAI integration untuk fitness guidance
- ✅ **Responsive Design** - Mobile-first dengan Tailwind CSS
- ✅ **Type Safety** - Prisma untuk type-safe database operations

## 🔧 Development Guidelines

### Server Components vs Client Components

**Gunakan Server Components (default) untuk:**
- Data fetching
- Static content
- SEO-critical pages
- Database operations

**Gunakan Client Components (`"use client"`) hanya untuk:**
- Interactive elements (forms, buttons)
- Browser APIs (localStorage, geolocation)
- State management (useState, useEffect)
- Event handlers

### Server Actions

Semua form submissions dan data mutations menggunakan server actions di `src/app/action.js`:

```javascript
"use server";

export async function saveData(formData) {
  // Server-side logic
}
```

## 🚨 Current Issues to Fix

### 1. Excessive Client Components
**Problem:** Semua dashboard pages menggunakan `"use client"` padahal bisa menggunakan server components.

**Solution:** Refactor dashboard pages untuk menggunakan server components dengan server actions.

### 2. Missing Dependencies
**Problem:** Beberapa dependencies penting belum terinstall.

**Solution:** Install dependencies yang diperlukan:
```bash
npm install next-auth bcryptjs @aws-sdk/client-s3
```

### 3. Environment Setup
**Problem:** File `.env` belum ada.

**Solution:** Copy dari `.env.example` dan isi dengan credentials yang benar.

## 📚 Learning Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Follow server-first architecture
2. Minimize client components usage
3. Use server actions for data mutations
4. Follow TypeScript best practices
5. Write clean, readable code


# Proyek BodyGoal - Penjelasan Perhitungan Diet untuk Ahli Gizi

Dokumen ini menjelaskan secara rinci perhitungan dan fitur terkait diet yang diterapkan dalam proyek BodyGoal. Ditulis untuk ahli gizi dan profesional non-IT agar memahami bagaimana proyek ini menghitung dan mengelola rencana diet, target kalori, dan pelacakan progres.

---

## 1. Perhitungan Basal Metabolic Rate (BMR) dan Total Daily Energy Expenditure (TDEE)

Proyek ini menghitung kebutuhan kalori harian Anda berdasarkan data pribadi menggunakan rumus ilmiah standar yang disebut persamaan Mifflin-St Jeor.

- **BMR (Basal Metabolic Rate)** memperkirakan jumlah kalori yang dibutuhkan tubuh Anda saat istirahat untuk menjalankan fungsi dasar seperti bernapas dan sirkulasi.
- Rumus ini menggunakan **berat badan (kg)**, **tinggi badan (cm)**, **usia (tahun)**, dan **jenis kelamin** Anda.

Rumusnya adalah:

- Untuk pria:  
  `BMR = 10 × berat + 6.25 × tinggi - 5 × usia + 5`
- Untuk wanita:  
  `BMR = 10 × berat + 6.25 × tinggi - 5 × usia - 161`

Selanjutnya, BMR dikalikan dengan **faktor aktivitas** untuk memperkirakan Total Daily Energy Expenditure (TDEE), yang memperhitungkan tingkat aktivitas fisik harian Anda:

| Tingkat Aktivitas       | Faktor     |
|------------------------|------------|
| Sedentari (jarang olahraga) | 1.2        |
| Ringan (1-3 hari/minggu) | 1.375      |
| Sedang (3-5 hari/minggu) | 1.55       |
| Aktif (6-7 hari/minggu) | 1.725      |
| Sangat Aktif (latihan berat/pekerjaan fisik) | 1.9        |

---

## 2. Penyesuaian Target Kalori Berdasarkan Tujuan

Setelah menghitung TDEE, proyek ini menyesuaikan target kalori harian Anda berdasarkan tujuan pribadi:

- **Menurunkan Berat Badan:** Mengurangi 500 kalori dari TDEE untuk menciptakan defisit kalori.
- **Menaikkan Berat Badan:** Menambah 300 kalori ke TDEE untuk mendukung penambahan berat.
- **Menjaga Berat Badan:** Menggunakan TDEE tanpa perubahan untuk pemeliharaan.

Target kalori ini menjadi panduan untuk perencanaan makan dan rekomendasi olahraga harian Anda.

---

## 3. Rencana Makan dan Olahraga yang Dibuat oleh AI

Berdasarkan data pribadi dan target kalori Anda, proyek ini menghasilkan rencana makan dan olahraga harian yang dipersonalisasi dengan bantuan model AI.

- Rencana makan mencantumkan makanan beserta kandungan kalorinya dan deskripsi singkat.
- Rencana olahraga mencantumkan jenis latihan dengan durasi dan deskripsi.
- Total kalori dalam rencana makan disesuaikan agar mendekati target kalori Anda.

Rencana ini ditampilkan di halaman **Dashboard Rencana** dan dapat dibuat ulang kapan saja.

---

## 4. Pencatatan Makanan dan Pelacakan Kalori

Di halaman **Dashboard Makanan**, Anda dapat:

- Melihat rencana makan AI untuk hari ini.
- Mencatat makanan yang sudah dikonsumsi beserta kalorinya.
- Melihat total kalori yang sudah dikonsumsi hari ini dibandingkan dengan target kalori.
- Mendapatkan saran nutrisi dari AI untuk memperbaiki pilihan makanan.

Fitur ini membantu Anda memantau asupan kalori harian sesuai target pribadi.

---

## 5. Pencatatan Berat Badan dan Pelacakan Progres

Di halaman **Dashboard Progres**, Anda dapat:

- Mencatat berat badan harian.
- Melihat riwayat berat badan terbaru.
- Mendapatkan saran AI untuk pelacakan progres dan manajemen berat badan berdasarkan tren berat dan tujuan Anda.

Fitur ini mendukung pemantauan kemajuan menuju target berat badan.

---

## 6. Pelatih Pribadi AI

Halaman **Dashboard Pelatih** menyediakan antarmuka pelatih pribadi berbasis AI yang dapat Anda ajukan pertanyaan tentang kebugaran, nutrisi, motivasi, dan progres. Pelatih menggunakan data profil dan aktivitas terbaru Anda untuk memberikan saran yang dipersonalisasi.

---

## Ringkasan Halaman dan Fitur

| Halaman                          | Fitur Terkait Perhitungan Diet                      |
|---------------------------------|----------------------------------------------------|
| Dashboard Rencana (`/dashboard/plan`) | Form onboarding, rencana makan dan olahraga AI       |
| Dashboard Makanan (`/dashboard/meals`) | Pencatatan makanan, pelacakan kalori, saran nutrisi AI |
| Dashboard Progres (`/dashboard/progress`) | Pencatatan berat badan, pelacakan progres, saran AI     |
| Dashboard Pelatih (`/dashboard/coach`) | Pelatih pribadi AI untuk saran yang dipersonalisasi       |

---

Proyek ini menggabungkan rumus ilmiah dengan bantuan AI untuk menyediakan perencanaan diet dan kebugaran yang dipersonalisasi, pelacakan, dan pelatihan guna membantu pengguna mencapai tujuan kesehatan secara efektif.

Jika ada pertanyaan atau membutuhkan klarifikasi lebih lanjut, silakan hubungi kami.

---

*Dokumen selesai*

## 📄 License

MIT License - see LICENSE file for details.
