# Deploy to Vercel - Step by Step Guide

## Option 1: Deploy via Vercel CLI (Recommended for Testing)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
cd /Users/yoshikondo/signal-based-recruitment
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (Select your account)
- Link to existing project? **N**
- Project name? (Press Enter for default)
- Directory? (Press Enter for `./`)
- Override settings? **N**

### Step 4: Set Environment Variables
```bash
vercel env add DATABASE_URL
# Paste your PostgreSQL connection string

vercel env add SERPAPI_API_KEY
# Paste your SerpAPI key (optional but recommended)

vercel env add REDIS_URL
# Paste your Redis URL (optional, for queue)

vercel env add CRON_SECRET
# Generate a random secret: openssl rand -hex 32

vercel env add WEBHOOK_SECRET
# Generate another random secret: openssl rand -hex 32
```

### Step 5: Run Database Migrations
```bash
# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

### Step 6: Redeploy with Environment Variables
```bash
vercel --prod
```

## Option 2: Deploy via GitHub (Recommended for Production)

### Step 1: Create GitHub Repository
```bash
cd /Users/yoshikondo/signal-based-recruitment
git remote add origin https://github.com/YOUR_USERNAME/signal-based-recruitment.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Click "Import"

### Step 3: Configure Project
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### Step 4: Add Environment Variables
In Vercel dashboard → Your Project → Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
SERPAPI_API_KEY=your_serpapi_key (optional)
SCRAPERAPI_KEY=your_scraperapi_key (optional)
REDIS_URL=redis://default:password@host:6379 (optional)
CRON_SECRET=your_random_secret
WEBHOOK_SECRET=your_random_secret
DEFAULT_LOCATION=Brazil
LOG_LEVEL=info
```

### Step 5: Deploy
Click "Deploy" button. Vercel will:
1. Install dependencies
2. Run `prisma generate` (via postinstall)
3. Build the Next.js app
4. Deploy to production

### Step 6: Run Database Migrations
After first deployment, run migrations:

```bash
# Option A: Via Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Option B: Via Vercel Dashboard
# Go to your project → Settings → Environment Variables
# Copy DATABASE_URL, then run locally:
npx prisma migrate deploy
```

## Option 3: Quick Deploy (No Database Setup)

For testing without a database, you can deploy with mock data:

1. Deploy to Vercel (follow Option 1 or 2)
2. Skip DATABASE_URL (the app will use mock data)
3. Test the UI and API endpoints

Note: Data won't persist without a database.

## Testing the Deployment

### 1. Check Deployment Status
Visit: `https://your-project.vercel.app`

### 2. Test API Endpoints

**Health Check:**
```bash
curl https://your-project.vercel.app/api/stats
```

**Signal Ingestion:**
```bash
curl -X POST https://your-project.vercel.app/api/ingest/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["Head of Engineering"],
    "location": "Brazil",
    "daysBack": 7
  }'
```

**Queue Stats:**
```bash
curl https://your-project.vercel.app/api/queue/stats
```

### 3. Test UI
1. Open https://your-project.vercel.app
2. Navigate to "Signal Ingestion" tab
3. Enter keywords and location
4. Click "Ingest Signals"
5. Check "Action Buckets" tab for results

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify Prisma schema is correct

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check database allows connections from Vercel IPs
- Ensure SSL is enabled if required

### API Errors
- Check environment variables are set
- Review function logs in Vercel dashboard
- Verify API keys are correct

### Cron Jobs Not Running
- Check `CRON_SECRET` is set
- Verify cron configuration in `vercel.json`
- Check Vercel Cron logs

## Next Steps After Deployment

1. ✅ Set up monitoring (Vercel Analytics)
2. ✅ Configure error tracking (Sentry)
3. ✅ Set up alerts for failures
4. ✅ Test all endpoints
5. ✅ Monitor API usage and costs
6. ✅ Optimize collection strategies

## Quick Test Commands

```bash
# Test deployment
curl https://your-project.vercel.app/api/stats

# Test signal ingestion
curl -X POST https://your-project.vercel.app/api/ingest/v2 \
  -H "Content-Type: application/json" \
  -d '{"keywords":["CTO"],"location":"Brazil"}'

# Test webhook
curl -X POST https://your-project.vercel.app/api/webhooks/signals \
  -H "Content-Type: application/json" \
  -H "X-Signal-Source: test" \
  -d '{"type":"funding","company_name":"TestCorp","amount":1000000}'
```




