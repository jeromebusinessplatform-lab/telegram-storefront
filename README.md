# Welcome to your Enter project

[![Built with enter.pro](https://img.shields.io/badge/Build%20with-Enter.pro-FC5776?style=for-the-badge&labelColor=1F1F1F)](https://enter.pro)

*Automatically synced with your [enter.pro](https://enter.pro) workspace* 

---

## Overview

This repository is automatically linked to your app on [enter.pro](https://enter.pro).  
Every change you make in Enter will be reflected here — and any updates you push to this repo will sync back seamlessly.  

Enter.pro helps you **build, edit, and deploy full-stack web apps by prompting**.  
Just describe what you want — Enter turns ideas into production-ready code.

---

## Project URLs

**Live app:** https://<project-id>-latest.preview.enter.pro  
**Edit & build in Enter:** https://enter.pro/project/<project-id>


---

## Continue building

Keep developing your app directly in [Enter.pro](https://enter.pro/project/<project-id>).  
Prompt new features, refine the UI, or connect integrations — all changes are versioned and synced automatically to GitHub.

---

## Local development

Prefer to work locally? You can clone this repo and start developing right away:

```bash
# Step 1: Clone your project repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate into the project folder
cd <YOUR_PROJECT_NAME>

# Step 3: Install all dependencies
npm install

# Step 4: Start the local development server
npm run dev
```

Push your commits — Enter.pro will automatically detect and sync your latest changes.

---

## Tech stack

This project uses:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

---

## Deployment

To deploy, open your Enter.pro project and click "Publish"

Your app will automatically build and go live at your production URL.

### Vercel + GitHub + Supabase

This repo is now ready to be connected to GitHub, deployed on Vercel, and pointed at Supabase.

1. Create or connect a GitHub repository for this codebase.
2. Import that GitHub repo into Vercel.
3. Add these environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ENTER_ANALYTICS_ENABLED`
   - `VITE_ENTER_ANALYTICS_TOKEN`
   - `VITE_ENTER_PROJECT_ID`
   - `VITE_ENTER_ANALYTICS_ENDPOINT`
   - `VITE_ENTER_ANALYTICS_DEFINITIONS_ENDPOINT`
   - `VITE_ENTER_ANALYTICS_DEBUG`
4. Keep the Supabase project schema and migrations in sync with the `supabase/` directory.
5. Push through GitHub so Vercel can create previews and production deploys automatically.

The frontend now reads Supabase credentials from environment variables, with the current project values as local fallbacks.

### Telegram Mini App Deployment Split

- Vercel: hosts the web app on a free `*.vercel.app` preview/production subdomain.
- Railway: hosts the Telegram bot process.
- Supabase: hosts the database, RLS policies, and the lightweight auth helpers in `supabase/functions/`.

Required secrets:
- Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Supabase/Railway backend: `TELEGRAM_BOT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`

Auth flow:
- Telegram Mini App users are verified from `Telegram.WebApp.initData`.
- Admin users exchange the admin access code for an admin token.
- The frontend uses the signed token to satisfy RLS without a heavier auth stack.

---

✨ Keep prompting, keep building — Enter.pro handles the rest.
