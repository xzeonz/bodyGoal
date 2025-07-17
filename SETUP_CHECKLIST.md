# 📋 SETUP CHECKLIST - BodyGoal Project

## 🎯 Overview
Checklist lengkap untuk setup database dan services yang diperlukan untuk BodyGoal project.

---

## 1. 🗄️ DATABASE SETUP (NeonDB)

### Step-by-Step Setup:

#### ✅ **1.1 Create NeonDB Account**
- [ ] Buka [neon.tech](https://neon.tech/)
- [ ] Sign up dengan GitHub/Google account
- [ ] Verify email address

#### ✅ **1.2 Create New Project**
- [ ] Click "Create Project"
- [ ] Project name: `bodygoal-db`
- [ ] Region: pilih yang terdekat (US East/Europe)
- [ ] PostgreSQL version: 15 (default)

#### ✅ **1.3 Get Connection String**
- [ ] Copy connection string dari dashboard
- [ ] Format: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`
- [ ] Paste ke `.env` file sebagai `DATABASE_URL`

#### ✅ **1.4 Test Connection**
```bash
# Test connection
npx prisma db push
npx prisma generate
```

#### ✅ **1.5 Run Migrations**
```bash
# Create and run migration
npx prisma migrate dev --name init
```

---

## 2. 🔐 GOOGLE OAUTH SETUP

### Step-by-Step Setup:

#### ✅ **2.1 Google Cloud Console**
- [ ] Buka [console.cloud.google.com](https://console.cloud.google.com/)
- [ ] Login dengan Google account
- [ ] Accept terms of service

#### ✅ **2.2 Create New Project**
- [ ] Click "Select a project" → "New Project"
- [ ] Project name: `bodygoal-auth`
- [ ] Organization: pilih yang sesuai
- [ ] Click "Create"

#### ✅ **2.3 Enable APIs**
- [ ] Go to "APIs & Services" → "Library"
- [ ] Search "Google+ API" → Enable
- [ ] Search "People API" → Enable (optional)

#### ✅ **2.4 Configure OAuth Consent Screen**
- [ ] Go to "APIs & Services" → "OAuth consent screen"
- [ ] User Type: External
- [ ] App name: `BodyGoal Fitness App`
- [ ] User support email: your email
- [ ] Developer contact: your email
- [ ] Save and continue

#### ✅ **2.5 Create OAuth Credentials**
- [ ] Go to "APIs & Services" → "Credentials"
- [ ] Click "+ CREATE CREDENTIALS" → "OAuth 2.0 Client IDs"
- [ ] Application type: Web application
- [ ] Name: `BodyGoal Web Client`
- [ ] Authorized JavaScript origins:
  - `http://localhost:3000`
  - `http://localhost:3001`
- [ ] Authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google`
  - `http://localhost:3001/api/auth/callback/google`
- [ ] Click "Create"

#### ✅ **2.6 Save Credentials**
- [ ] Copy Client ID → paste ke `.env` sebagai `GOOGLE_CLIENT_ID`
- [ ] Copy Client Secret → paste ke `.env` sebagai `GOOGLE_CLIENT_SECRET`
- [ ] Generate random string untuk `NEXTAUTH_SECRET`

---

## 3. 🤖 OPENAI API SETUP

### Step-by-Step Setup:

#### ✅ **3.1 Create OpenAI Account**
- [ ] Buka [platform.openai.com](https://platform.openai.com/)
- [ ] Sign up dengan email/Google
- [ ] Verify email address
- [ ] Complete phone verification

#### ✅ **3.2 Add Payment Method**
- [ ] Go to "Billing" → "Payment methods"
- [ ] Add credit card (minimum $5 credit)
- [ ] Set usage limits (recommended: $10/month)

#### ✅ **3.3 Generate API Key**
- [ ] Go to "API Keys"
- [ ] Click "+ Create new secret key"
- [ ] Name: `BodyGoal Development`
- [ ] Copy API key → paste ke `.env` sebagai `OPENAI_API_KEY`
- [ ] **⚠️ IMPORTANT:** Save key securely, tidak bisa dilihat lagi!

#### ✅ **3.4 Test API Key**
```bash
# Test di terminal atau test page
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 4. ☁️ CLOUDFLARE R2 SETUP (Optional)

### Step-by-Step Setup:

#### ✅ **4.1 Create Cloudflare Account**
- [ ] Buka [cloudflare.com](https://cloudflare.com/)
- [ ] Sign up dengan email
- [ ] Verify email address

#### ✅ **4.2 Enable R2 Storage**
- [ ] Go to dashboard → "R2 Object Storage"
- [ ] Click "Enable R2"
- [ ] Add payment method (pay-as-you-go)

#### ✅ **4.3 Create R2 Bucket**
- [ ] Click "Create bucket"
- [ ] Bucket name: `bodygoal-uploads`
- [ ] Location: Auto (default)
- [ ] Click "Create bucket"

#### ✅ **4.4 Generate API Tokens**
- [ ] Go to "Manage Account" → "API Tokens"
- [ ] Click "Create Token"
- [ ] Use "R2 Token" template
- [ ] Permissions: Object Read & Write
- [ ] Account resources: Include - All accounts
- [ ] Zone resources: Include - All zones
- [ ] Click "Continue to summary" → "Create Token"

#### ✅ **4.5 Save R2 Credentials**
- [ ] Copy Access Key ID → `.env` sebagai `CLOUDFLARE_R2_ACCESS_KEY_ID`
- [ ] Copy Secret Access Key → `.env` sebagai `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- [ ] Bucket name → `.env` sebagai `CLOUDFLARE_R2_BUCKET_NAME`
- [ ] Account ID → `.env` sebagai `CLOUDFLARE_R2_ACCOUNT_ID`

#### ✅ **4.6 Configure Custom Domain (Optional)**
- [ ] Go to R2 bucket → "Settings" → "Custom Domains"
- [ ] Add custom domain: `uploads.yourdomain.com`
- [ ] Update DNS records as instructed
- [ ] Add to `.env` sebagai `CLOUDFLARE_R2_PUBLIC_URL`

---

## 5. 📁 ENVIRONMENT VARIABLES

### ✅ **5.1 Create .env File**
```bash
# Copy template
cp .env.example .env
```

### ✅ **5.2 Fill All Variables**
```env
# Database (NeonDB)
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# OpenAI API
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_SECRET="your-nextauth-secret-random-string"
NEXTAUTH_URL="http://localhost:3000"

# Cloudflare R2 (Optional)
CLOUDFLARE_R2_ACCESS_KEY_ID="your-r2-access-key"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-r2-secret-key"
CLOUDFLARE_R2_BUCKET_NAME="bodygoal-uploads"
CLOUDFLARE_R2_ACCOUNT_ID="your-account-id"
CLOUDFLARE_R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
CLOUDFLARE_R2_PUBLIC_URL="https://uploads.yourdomain.com"
```

---

## 6. 🧪 TESTING SETUP

### ✅ **6.1 Test Database Connection**
```bash
npx prisma studio
# Should open Prisma Studio at http://localhost:5555
```

### ✅ **6.2 Test OpenAI API**
- [ ] Go to `/test` page
- [ ] Test AI Coach feature
- [ ] Should get response from OpenAI

### ✅ **6.3 Test Google OAuth**
```bash
# Install NextAuth first
npm install next-auth
```
- [ ] Implement login page
- [ ] Test Google sign-in flow

### ✅ **6.4 Test R2 Upload (Optional)**
```bash
# Install AWS SDK
npm install @aws-sdk/client-s3
```
- [ ] Test file upload functionality
- [ ] Verify files appear in R2 bucket

---

## 7. 🚀 DEPLOYMENT PREPARATION

### ✅ **7.1 Production Environment Variables**
- [ ] Setup production database (NeonDB production branch)
- [ ] Update OAuth redirect URIs for production domain
- [ ] Setup production R2 bucket
- [ ] Configure production environment variables

### ✅ **7.2 Security Checklist**
- [ ] Never commit `.env` file to git
- [ ] Use strong `NEXTAUTH_SECRET`
- [ ] Restrict OAuth domains in production
- [ ] Set R2 bucket permissions correctly
- [ ] Enable CORS for R2 if needed

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues:

#### Database Connection Issues:
```bash
# Check connection
npx prisma db push

# Reset database if needed
npx prisma migrate reset
```

#### OAuth Issues:
- Check redirect URIs match exactly
- Verify OAuth consent screen is published
- Check client ID/secret are correct

#### OpenAI API Issues:
- Verify API key is valid
- Check billing/usage limits
- Test with simple request first

#### R2 Upload Issues:
- Verify bucket permissions
- Check CORS configuration
- Test with AWS CLI first

---

## ✅ COMPLETION CHECKLIST

- [ ] ✅ NeonDB database created and connected
- [ ] ✅ Google OAuth configured and tested
- [ ] ✅ OpenAI API key working
- [ ] ✅ Cloudflare R2 setup (optional)
- [ ] ✅ All environment variables configured
- [ ] ✅ Database migrations run successfully
- [ ] ✅ All services tested and working
- [ ] ✅ Ready for development!

---

**🎉 Setup Complete! Ready to build amazing fitness app! 💪**

*Last updated: $(Get-Date -Format "yyyy-MM-dd")*