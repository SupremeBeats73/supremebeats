This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Google / Apple / Facebook sign-in (OAuth)

If you see **"sent an invalid response"** or sign-in fails when using Google (or Apple/Facebook), configure your Supabase project:

1. **Redirect URL**  
   In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **URL Configuration** → **Redirect URLs**, add:
   - For local dev: `http://localhost:3000/auth/callback`
   - For production: `https://your-domain.com/auth/callback` (match your app URL)

2. **Site URL**  
   Set **Site URL** to your app origin (e.g. `http://localhost:3000` or `https://your-domain.com`).

3. **Google provider**  
   Under **Authentication** → **Providers** → **Google**, enable Google and add the Client ID and Client Secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials). In Google Cloud Console, open your **OAuth 2.0 Client ID** (Web application) and:
   - **Authorized redirect URIs**: add your **Supabase** callback URL (not your app’s), e.g. `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`. If you get **HTTP 400** when signing in with Google, this is usually because this exact URI is missing or wrong.
   - **Authorized JavaScript origins**: add your app origin, e.g. `http://localhost:3000` for local dev or `https://your-domain.com` for production.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
