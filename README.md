# 👶 Baby Tracker (SunnyBaby)

A modern, local-first React application designed for internal use to track baby milestones, feedings, diaper changes, and sleep patterns with real-time cloud synchronization.

![Baby Tracker Mascot](./assets/baby_mascot_clean-removebg-preview.png)

## ✨ Internal Version Features

- **📊 Comprehensive Tracking**: Log feedings (bottle/nursing), diapers, sleep, and vaccinations.
- **📈 Growth Analytics**: Beautifully visualized trends and daily activity summaries.
- **🔐 Internal Authentication**: Direct Username/Password login (no email required).
- **☁️ Appwrite Real-time Sync**: Instant data synchronization across devices using Appwrite Cloud.
- **🛡️ Privacy & Persistence**: Data is stored locally in IndexedDB and backed up securely in your private Appwrite instance. Sessions are persistent (Remember Me).
- **🎨 Playful UI**: Modern glassmorphism design with GSAP animations.

## 🚀 Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Database**: [Dexie.js](https://dexie.org/) (Local-first IndexedDB)
- **Backend**: [Appwrite Cloud](https://appwrite.io/) (Auth, Database, Realtime)
- **Animations**: [GSAP](https://greensock.com/gsap/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🛠️ Setup & Usage

### 1. Appwrite Backend Setup
The app requires an Appwrite project. Use the provided automation script to initialize your database:
```bash
node scripts/setupAppwrite.cjs
```
*(Requires `APPWRITE_API_KEY` in your environment)*

### 2. Running Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```

### 3. Login Guide
- **Username**: Enter your chosen internal username.
- **Password**: Enter your secure password.
- **Remember Me**: Check this to stay logged in indefinitely on this device.

> [!NOTE]
> This app is configured for internal use. Usernames are mapped to internal identities (`username@sunnybaby.internal`).

## 📦 Deployment

Deploy to Vercel or Netlify. Ensure your Appwrite Project ID and Database ID in `services/appwriteService.ts` match your Appwrite dashboard.

---
*Created for reliable, real-time family tracking.*
