# Testing Guide - Deployed Application

## 🎉 Deployment Successful!

Your application is now live at:
**https://signal-based-recruitment-pis6cgc4h-yoshi-kondos-projects.vercel.app**

## Quick Tests

### 1. Test Homepage
```bash
curl https://signal-based-recruitment-pis6cgc4h-yoshi-kondos-projects.vercel.app
```
Or open in browser: https://signal-based-recruitment-pis6cgc4h-yoshi-kondos-projects.vercel.app

### 2. Test Stats API
```bash
curl https://signal-based-recruitment-pis6cgc4h-yoshi-kondos-projects.vercel.app/api/stats
```

Expected response:
```json
{
  "totalSignals": 0,
  "processedSignals": 0,
  "activeBuckets": 0,
  "totalCandidates": 0
}
```

### 3. Test Signal Ingestion (Mock Data)
```bash
curl -X POST https://signal-based-recruitment-pis6cgc4h-yoshi-kondos-projects.vercel.app/api/ingest/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["Head of Engineering"],
    "location": "Brazil",
    "daysBack": 30
  }'
```

### 4. Test Queue Stats
```bash
curl https://signal-based-recruitment-pis6cgc4h-yoshi-kondos-projects.vercel.app/api/queue/stats
```

### 5. Test Webhook Endpoint
```bash
curl -X POST https://signal-based-recruitment-pis6cgc4h-yoshi-kondos-projects.vercel.app/api/webhooks/signals \
  -H "Content-Type: application/json" \
  -H "X-Signal-Source: test" \
  -d '{
    "type": "funding",
    "company_name": "TestCorp",
    "amount": 5000000,
    "round": "Series A",
    "date": "2024-01-15"
  }'
```

## Setting Up Environment Variables

To enable full functionality, add these in Vercel Dashboard:

1. Go to: https://vercel.com/yoshi-kondos-projects/signal-based-recruitment/settings/environment-variables

2. Add these variables:

### Required for Database:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### Optional but Recommended:
```
SERPAPI_API_KEY=your_serpapi_key
SCRAPERAPI_KEY=your_scraperapi_key
REDIS_URL=redis://default:password@host:6379
CRON_SECRET=your_random_secret
WEBHOOK_SECRET=your_random_secret
APOLLO_API_KEY=your_apollo_key
```

### After Adding Environment Variables:

1. Redeploy the application:
```bash
vercel --prod
```

2. Run database migrations:
```bash
# Pull env vars
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

## Testing with Real APIs

Once you add API keys:

1. **Test SerpAPI Collection:**
```bash
curl -X POST https://signal-based-recruitment-pis6cgc4h-yoshi-kondos-projects.vercel.app/api/ingest/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["Head of Engineering"],
    "location": "Brazil",
    "sources": ["serpapi"]
  }'
```

2. **Test Queue Processing:**
```bash
curl -X POST https://signal-based-recruitment-pis6cgc4h-yoshi-kondos-projects.vercel.app/api/ingest/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["VP of Sales"],
    "location": "Brazil",
    "useQueue": true
  }'
```

## Monitoring

### View Logs
```bash
vercel logs https://signal-based-recruitment-pis6cgc4h-yoshi-kondos-projects.vercel.app
```

### View Deployment
Visit: https://vercel.com/yoshi-kondos-projects/signal-based-recruitment

## Next Steps

1. ✅ Application deployed successfully
2. ⏳ Set up database (PostgreSQL)
3. ⏳ Add API keys for signal collection
4. ⏳ Configure Redis for queue (optional)
5. ⏳ Test all endpoints
6. ⏳ Set up monitoring

## Troubleshooting

### Database Connection Errors
- Verify `DATABASE_URL` is set correctly
- Check database allows connections from Vercel
- Ensure SSL is enabled if required

### API Errors
- Check environment variables are set
- Review function logs in Vercel dashboard
- Verify API keys are correct

### Build Errors
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation

## Production URL

**Main URL:** https://signal-based-recruitment-pis6cgc4h-yoshi-kondos-projects.vercel.app

**Inspect Deployment:** https://vercel.com/yoshi-kondos-projects/signal-based-recruitment

