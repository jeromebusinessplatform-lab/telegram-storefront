# Telegram E-Commerce Mini App

This repository contains a Telegram Mini App frontend, Supabase functions and migrations, and a minimal Railway bot service.

## Stack

- Vite + React + TypeScript frontend
- Supabase for database, RLS, and auth helpers
- Railway for the Telegram bot process
- Vercel for the public web app

## What is deployed where

- Vercel hosts the Mini App frontend on a free `*.vercel.app` subdomain or your own custom subdomain.
- Railway hosts `bot/`, which responds to Telegram updates and sends users into the Mini App.
- Supabase hosts the database, migrations, and Edge Functions.

## Required environment variables

### Frontend / Vercel

Set these in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional analytics variables already supported by the app:

- `VITE_ENTER_ANALYTICS_ENABLED`
- `VITE_ENTER_ANALYTICS_TOKEN`
- `VITE_ENTER_PROJECT_ID`
- `VITE_ENTER_ANALYTICS_ENDPOINT`
- `VITE_ENTER_ANALYTICS_DEFINITIONS_ENDPOINT`
- `VITE_ENTER_ANALYTICS_DEBUG`

### Railway bot service

Set these in Railway for the `bot/` service:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBAPP_URL`
- `TELEGRAM_WEBHOOK_URL`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_ADMIN_CHAT_IDS`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT`

### Supabase auth helpers

The Edge Functions in `supabase/functions/` require:

- `TELEGRAM_BOT_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

### Order issue relay

- Admins can trigger an order issue relay from the order detail screen.
- The customer gets a Telegram message from the storefront bot.
- Customer replies to that bot message are forwarded to the admin chat IDs configured in Railway.
- Admin replies to the bot message are sent back to the customer from the same bot account.
- The relay is thread-based, so replies stay tied to the exact issue message instead of a generic open thread.

### Supabase storage

Create or deploy the `payment-proofs` bucket from the migration in `supabase/migrations/`. It stores customer receipt images for manual verification.

## Deployment order

1. Push this repo to GitHub.
2. Import the GitHub repo into Vercel and set the frontend env vars.
3. Deploy the `bot/` folder as a Railway service and set the bot env vars.
4. Deploy the Supabase migrations from `supabase/migrations/`.
5. Deploy the Supabase Edge Functions from `supabase/functions/`.
6. Set the Telegram bot webhook to the Railway webhook URL.
7. Set your Telegram Mini App URL to the Vercel production URL.

## Production auth flow

- Telegram users open the bot and launch the Mini App from Telegram.
- The frontend verifies `Telegram.WebApp.initData` through Supabase Edge Functions.
- The auth helpers return signed JWT access tokens that carry the customer or admin claims.
- Supabase RLS uses those claims to authorize reads and writes without browser-side session handling.
- Manual QR payments work through a QR payment method plus receipt upload into Supabase Storage.
- There is no reliable way to auto-detect a bank transfer or QR payment without a provider/API, so verification stays manual.
- The order issue relay uses the storefront bot plus `supabase/functions/order-issue-notify`.

## Local development

```bash
npm install
npm run dev
```

To run the bot locally:

```bash
cd bot
npm install
npm start
```

## Notes

- The app uses lazy-loaded routes and a simple loading fallback to keep the initial bundle small.
- The auth model is intentionally minimal: Telegram launch verification for customers and a signed admin token for admin access.
- No extra auth provider is required for the beta-to-production path.
