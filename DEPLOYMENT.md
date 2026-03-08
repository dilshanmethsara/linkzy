# LinkZy Deployment Guide

## Vercel Deployment

### Prerequisites
- Node.js 18+ installed
- Vercel account
- GitHub repository connected to Vercel

### Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Project**
   ```bash
   npm run build
   ```

3. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect it's a React/Vite project
   - Set environment variables in Vercel dashboard:
     ```
     VITE_SUPABASE_URL=https://jbazoxfooexkhvqvebru.supabase.co
     VITE_SUPABASE_ANON_KEY=sb_publishable_odO-J3UbyUo3r2S6Yj6UaQ_-CdjmuVG
     ```

### Environment Variables Required
In Vercel Dashboard → Project Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Redirect Configuration
The project includes:
- `vercel.json` for proper routing
- `public/s.html` for short link redirects
- `public/404.html` for SPA fallback

### URL Patterns
- Short links: `yoursite.vercel.app/s/abc123` or `yoursite.vercel.app/abc123`
- Main app: `yoursite.vercel.app`
- Admin: `yoursite.vercel.app/admin`

### Troubleshooting
- If redirects don't work: Check `vercel.json` configuration
- If Supabase errors: Verify environment variables
- If 404s: Check build output includes `s.html`

## Manual Deployment
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## Production Checklist
- [ ] Environment variables set in Vercel
- [ ] Supabase edge functions deployed
- [ ] Test short link creation
- [ ] Test redirect functionality
- [ ] Test authentication
