# Deployment Guide - Vercel

This guide will walk you through deploying the Signal-Based Recruitment Sourcing platform to Vercel.

## Prerequisites

1. GitHub account
2. Vercel account (sign up at https://vercel.com)
3. PostgreSQL database (recommended: Vercel Postgres, Supabase, or Neon)

## Step 1: Push to GitHub

```bash
# Initialize git repository (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Signal-Based Recruitment Platform"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/signal-based-recruitment.git
git push -u origin main
```

## Step 2: Set Up Database

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Create a new database
4. Copy the connection string

### Option B: Supabase

1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string

### Option C: Neon

1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string

## Step 3: Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

4. Add Environment Variables:
   ```
   DATABASE_URL=your_postgres_connection_string
   APOLLO_API_KEY=your_apollo_api_key (optional)
   CLAY_API_KEY=your_clay_api_key (optional)
   ```

5. Click "Deploy"

## Step 4: Run Database Migrations

After deployment, you need to run Prisma migrations:

```bash
# Option 1: Using Vercel CLI
npx vercel env pull .env.local
npx prisma migrate deploy

# Option 2: Using Vercel Dashboard
# Go to your project → Settings → Environment Variables
# Copy DATABASE_URL, then run locally:
npx prisma migrate deploy
```

Or use Vercel's Postgres migration feature if available.

## Step 5: Verify Deployment

1. Visit your deployed URL (e.g., `https://your-project.vercel.app`)
2. Navigate to "ICP Config" and save configuration
3. Go to "Signal Ingestion" and test ingesting signals
4. Check "Action Buckets" to see processed signals

## Post-Deployment Configuration

### Set Up Cron Jobs (Optional)

For automatic signal ingestion, set up Vercel Cron:

1. Create `vercel.json` (already included)
2. Add cron configuration:

```json
{
  "crons": [{
    "path": "/api/cron/ingest",
    "schedule": "0 */6 * * *"
  }]
}
```

3. Create `/app/api/cron/ingest/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { SignalIngestion } from '@/lib/signals/ingestion';

export async function GET() {
  const ingestion = new SignalIngestion();
  await ingestion.ingestJobPostings({
    keywords: ['Head of Engineering', 'VP of Sales'],
    location: 'Brazil',
    daysBack: 7,
  });
  return NextResponse.json({ success: true });
}
```

### Monitoring

- Use Vercel Analytics for performance monitoring
- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor database connections and query performance

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correctly set in Vercel environment variables
- Check if your database allows connections from Vercel IPs
- Ensure SSL is enabled if required

### Build Errors

- Check that all dependencies are in `package.json`
- Verify TypeScript compilation passes locally
- Check Prisma client generation

### Runtime Errors

- Check Vercel function logs
- Verify API routes are correctly configured
- Ensure environment variables are set

## Scaling Considerations

1. **Database Connection Pooling**: Use a connection pooler (PgBouncer, Supabase Pooler)
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **Caching**: Add Redis for frequently accessed data
4. **Background Jobs**: Use Vercel Cron or external job queue for heavy processing

## Security

- Never commit `.env` files
- Use Vercel's environment variables for secrets
- Enable database SSL connections
- Implement API authentication for production use
- Add rate limiting to prevent abuse

## Support

For issues or questions:
- Check Vercel documentation: https://vercel.com/docs
- Prisma documentation: https://www.prisma.io/docs
- Next.js documentation: https://nextjs.org/docs

