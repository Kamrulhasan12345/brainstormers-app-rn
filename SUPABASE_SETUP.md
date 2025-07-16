# Supabase Setup Guide

## Problem

You're getting "Invalid API key" errors because your Supabase credentials are not configured.

## Solution Steps

### 1. Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (or create a new one if you don't have one)
3. Go to **Settings** > **API**
4. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon/public key** (starts with `eyJhbGciOiJIUzI1NiI...`)

### 2. Configure Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-key-here
```

### 3. Restart Your Development Server

After updating the `.env` file, restart your Expo development server:

```bash
npx expo start
```

## Demo Mode

If you don't have Supabase credentials yet, the app will automatically run in demo mode with these test accounts:

- **Admin**: `admin@brainstormers.edu` / `admin123`
- **Teacher**: `teacher@brainstormers.edu` / `teacher123`
- **Student**: `student@brainstormers.edu` / `student123`

Demo mode will be automatically disabled once you configure your actual Supabase credentials.

## Security Notes

- The `.env` file is already in `.gitignore` so your credentials won't be committed to version control
- Never share your Supabase credentials publicly
- Use the anon/public key (not the service role key) for client-side applications

## Troubleshooting

If you're still getting errors after configuration:

1. Double-check that your Supabase URL and key are correct
2. Make sure there are no extra spaces or quotes around the values in `.env`
3. Restart your development server after making changes
4. Check that your Supabase project is active and not paused
