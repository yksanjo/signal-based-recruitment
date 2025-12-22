# Quick Start: Production Signal Collection

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env
```

**Minimum required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SERPAPI_API_KEY` or `SCRAPERAPI_KEY` - For job collection

**Optional but recommended:**
- `REDIS_URL` - For queue and rate limiting
- `APOLLO_API_KEY` - For company enrichment
- `CRUNCHBASE_API_KEY` - For funding signals

### 3. Set Up Database
```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Start Collection

#### Option A: Via API (Recommended)
```bash
curl -X POST http://localhost:3000/api/ingest/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["Head of Engineering", "VP of Sales"],
    "location": "Brazil",
    "daysBack": 30,
    "sources": ["serpapi"]
  }'
```

#### Option B: Via Queue (Background Processing)
```bash
curl -X POST http://localhost:3000/api/ingest/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["CTO", "Director"],
    "location": "Brazil",
    "useQueue": true
  }'
```

#### Option C: Via UI
1. Start dev server: `npm run dev`
2. Go to "Signal Ingestion" tab
3. Enter keywords and location
4. Click "Ingest Signals"

## 📊 Collection Strategies

### Strategy 1: Single Source (Fastest)
```typescript
// Use only SerpAPI
await ingestion.ingestJobPostings({
  keywords: ['Head of Engineering'],
  location: 'Brazil',
  sources: ['serpapi'],
});
```

### Strategy 2: Multi-Source (Most Complete)
```typescript
// Use all available sources
await ingestion.ingestJobPostings({
  keywords: ['VP of Sales', 'Director'],
  location: 'Brazil',
  sources: ['serpapi', 'scraperapi', 'rss'],
});
```

### Strategy 3: Queue-Based (Scalable)
```typescript
// Process in background
await ingestion.ingestJobPostings({
  keywords: ['CTO'],
  location: 'Brazil',
  useQueue: true, // Non-blocking
});
```

## 🔄 Scheduled Collection

### Automatic (Vercel Cron)
Already configured! Runs every 6 hours via `/api/cron/ingest`

### Manual Setup
```typescript
import { SignalScheduler } from '@/lib/signals/scheduler';

const scheduler = new SignalScheduler();
scheduler.start(); // Runs every 6 hours
```

## 📡 Webhook Integration

Receive signals from external sources:

```bash
curl -X POST https://your-domain.com/api/webhooks/signals \
  -H "Content-Type: application/json" \
  -H "X-Signal-Source: external_api" \
  -d '{
    "type": "funding",
    "company_name": "TechCorp",
    "amount": 5000000,
    "round": "Series A",
    "date": "2024-01-15"
  }'
```

## 📈 Monitor Collection

### Check Queue Stats
```bash
curl http://localhost:3000/api/queue/stats
```

### View Logs
```bash
tail -f logs/combined.log
```

### Check Dashboard
Open http://localhost:3000 and view the Dashboard tab

## 🎯 Production Checklist

- [ ] API keys configured
- [ ] Redis set up (for queue)
- [ ] Database migrations run
- [ ] Test collection works
- [ ] Monitoring configured
- [ ] Scheduled jobs running

## 💡 Pro Tips

1. **Start with SerpAPI** - Most reliable
2. **Use queue for large batches** - Prevents timeouts
3. **Combine sources** - Higher coverage
4. **Monitor costs** - Track API usage
5. **Set up alerts** - Get notified of failures

## 🆘 Troubleshooting

**No signals collected?**
- Check API keys are set
- Verify rate limits
- Check logs: `logs/error.log`

**Queue not working?**
- Verify Redis connection
- Check queue stats endpoint
- Review worker logs

**High API costs?**
- Use RSS feeds (free)
- Reduce collection frequency
- Implement caching

## 📚 Next Steps

1. Read `PRODUCTION_SETUP.md` for detailed configuration
2. Set up monitoring and alerts
3. Configure webhooks for external sources
4. Optimize collection strategies
5. Scale with queue system

