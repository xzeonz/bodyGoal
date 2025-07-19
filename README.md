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

## 📄 License

MIT License - see LICENSE file for details.
