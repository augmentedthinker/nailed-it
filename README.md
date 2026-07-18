# Nailed It

A private, joyful social space for friends to share fresh nail sets, exchange inspiration, and hype each other up.

This repository contains the first mobile-first landing page for the product experiment.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The site is a Vite + React application deployed with Vercel. Its account flow uses Supabase Auth when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured. The initial profile schema and row-level security policies live in `supabase/migrations/`.
