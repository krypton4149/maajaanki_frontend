# Maa Jaanki Frontend Dashboard

## Install

npm install

## Run

npm run dev

## Build

npm run build

## Environment

Copy `.env.example` to `.env` and set:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / publishable key |
| `VITE_API_URL` | Backend base URL (`https://maajaanki-backend.vercel.app`) |
| `VITE_ADMIN_VERIFY_KEY` | Admin key for `POST /api/admin/orders/verify-payment` |

On Vercel (dashboard deploy), add the same four variables under **Project → Settings → Environment Variables**, then redeploy.