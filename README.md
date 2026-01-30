# 👶 Baby Tracker (SunnyBaby)

A modern, local-first React application designed for families to track their baby's milestones, feedings, diaper changes, and sleep patterns with ease and privacy.

![Baby Tracker Mascot](./assets/baby_mascot_clean-removebg-preview.png)

## ✨ Features

- **📊 Comprehensive Tracking**: Log feedings (bottle/nursing), diapers, sleep, and vaccinations.
- **📈 Growth Analytics**: Beautifully visualized trends and daily "Pulse" summaries.
- **🛡️ Privacy First**: Data is stored locally using **Dexie.js** (IndexedDB). No third-party tracking.
- **☁️ Google Drive Sync**: Optional private backup and family syncing via Google Drive's "App Data" folder.
- **👨‍👩‍👧‍👦 Family Sharing**: Generate unique invite links to sync data with partners or caregivers.
- **🎨 Playful UI**: "Pro Max" design aesthetics with glassmorphism, GSAP animations, and a responsive "Playful Pop" background.

## 🚀 Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Dexie.js](https://dexie.org/) (Local-first IndexedDB)
- **Animations**: [GSAP](https://greensock.com/gsap/) (GreenSock Animation Platform)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Auth/Storage**: [Google OAuth](https://developers.google.com/identity/gsi/web/guides/overview) + [Google Drive API](https://developers.google.com/drive/api/guides/about-sdk)

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Cloud Project (for Drive Sync)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/baby-tracker.git
   cd baby-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 📦 Deployment

This app is optimized for hosting on **Vercel** or **Netlify**.

1. Connect your repo to Vercel/Netlify.
2. Add your `VITE_GOOGLE_CLIENT_ID` to the platform's Environment Variables.
3. **Important**: Update your [Google Cloud Console](https://console.cloud.google.com/) authorized origins to include your new production URL.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Created with ❤️ for families.*
