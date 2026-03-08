# LinkShort - Full-Featured Link Shortener

A modern, full-featured link shortener application with user management, analytics, admin dashboard, referral system, and monetization features.

## Features

### User Features
- User authentication (signup, login, logout)
- Dashboard with all shortened links
- Create short links with custom aliases
- Automatic QR code generation for every link
- Detailed analytics: clicks per day, country, device, browser
- Profile settings and password management
- Referral system to earn points
- Withdrawal request system
- Responsive, modern UI with smooth animations

### Admin Features
- Role-based admin access
- Full analytics dashboard (total links, clicks, users)
- User management (block/unblock users)
- Link management (delete inappropriate links)
- Transaction management (approve/reject withdrawals)
- Comprehensive statistics and charts

### Technical Features
- Real-time click tracking with device and browser detection
- QR code generation
- Supabase backend (PostgreSQL database)
- Supabase Edge Functions for link redirection
- Row Level Security (RLS) for data protection
- Animated charts with Recharts
- Smooth animations with Framer Motion
- TypeScript for type safety
- Tailwind CSS for styling

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Backend**: Supabase Edge Functions
- **QR Codes**: qrcode library

## Database Schema

### Tables
1. **profiles** - User profiles with admin status, points, and referral codes
2. **links** - Shortened links with titles, QR codes, and click counts
3. **clicks** - Click tracking with device, browser, country, and timestamp
4. **referrals** - Referral tracking and points
5. **transactions** - Withdrawal requests and payment tracking

## Getting Started

### Prerequisites
- Node.js 16+ installed
- Supabase account (already configured)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Navbar.tsx
│   │   └── CreateLinkForm.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/                 # Utilities and configurations
│   │   └── supabase.ts
│   ├── pages/               # Application pages
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Analytics.tsx
│   │   ├── Settings.tsx
│   │   └── Admin.tsx
│   ├── App.tsx              # Main app component with routing
│   └── main.tsx             # Application entry point
├── supabase/
│   └── functions/
│       └── redirect/        # Edge function for link redirection
│           └── index.ts
└── public/
    ├── s.html              # Redirect handler page
    └── _redirects          # Routing configuration
```

## Usage

### For Regular Users

1. **Sign Up**: Create an account with email and password
2. **Create Links**:
   - Go to Dashboard
   - Click "Create New Link"
   - Enter destination URL
   - Optionally add a custom short code and title
   - QR code is automatically generated
3. **View Analytics**:
   - Click on "Analytics" in navigation
   - View clicks over time, top countries, device distribution
   - Filter by time range (7d, 30d, 90d)
4. **Manage Profile**:
   - Update name and password
   - View and share referral code
   - Request withdrawals

### For Admins

1. **Access Admin Panel**: Click "Admin Panel" in navigation
2. **Manage Users**: View all users, block/unblock accounts
3. **Manage Links**: View all links, delete inappropriate content
4. **Handle Transactions**: Approve or reject withdrawal requests
5. **View Statistics**: Total users, links, clicks, and pending withdrawals

### Creating an Admin Account

To make a user an admin, update the database directly:

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'admin@example.com';
```

## Link Shortening

Short links follow this format: `https://yourdomain.com/s/{short_code}`

The redirect flow:
1. User clicks short link
2. `/s.html` page loads
3. JavaScript calls Edge Function with short code
4. Edge Function tracks the click (device, browser, etc.)
5. Edge Function redirects to original URL

## Analytics Features

- **Clicks Over Time**: Line chart showing daily clicks
- **Top Countries**: Bar chart of top 5 countries
- **Device Distribution**: Pie chart (mobile/desktop/tablet)
- **Browser Stats**: Bar chart of top 5 browsers
- **Real-time Updates**: Data refreshes on navigation

## Referral System

- Each user gets a unique referral code
- Share link: `https://yourdomain.com/signup?ref={referral_code}`
- Earn 10 points per referral
- Points can be converted to withdrawals

## Security Features

- Row Level Security (RLS) on all tables
- Password hashing via Supabase Auth
- JWT authentication
- IP hashing for privacy
- Admin-only access controls

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables from `.env`
4. Deploy

### Deploy to Netlify

1. Push code to GitHub
2. Import project in Netlify
3. Add environment variables
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Deploy

### Configure Custom Domain

1. Add custom domain in your hosting platform
2. Update Edge Function URL in `public/s.html`:
   - Replace `https://jrvqhvzqcnntwngttedl.supabase.co` with your domain
3. Rebuild and redeploy

## Future Enhancements

- Custom domains for premium users
- Link expiration dates
- Password-protected links
- Link editing capabilities
- Bulk link creation via CSV
- API for developers
- Integration with ad networks
- Email notifications
- Advanced analytics (referrer tracking, conversion funnels)
- Link preview images
- Custom QR code styling

## Support

For issues or questions, contact support or check the documentation.

## License

MIT License - Feel free to use this project for personal or commercial purposes.
