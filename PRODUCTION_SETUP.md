# Production Setup Guide

This guide covers setting up production-grade signal collection for the Signal-Based Recruitment platform.

## Required API Keys

### 1. SerpAPI (Recommended for LinkedIn/Indeed)
- Sign up: https://serpapi.com/
- Get API key from dashboard
- Add to `.env`: `SERPAPI_API_KEY=your_key_here`
- Pricing: $50/month for 5,000 searches

### 2. ScraperAPI (Alternative for direct scraping)
- Sign up: https://www.scraperapi.com/
- Get API key from dashboard
- Add to `.env`: `SCRAPERAPI_KEY=your_key_here`
- Pricing: $49/month for 10,000 requests

### 3. Crunchbase (For funding signals)
- Sign up: https://data.crunchbase.com/
- Get API key
- Add to `.env`: `CRUNCHBASE_API_KEY=your_key_here`

### 4. Redis (For queue and rate limiting)
- Option A: Vercel KV (Redis-compatible)
  - Add via Vercel dashboard
  - Automatically available as `REDIS_URL`
- Option B: Upstash Redis
  - Sign up: https://upstash.com/
  - Create database
  - Add to `.env`: `REDIS_URL=your_redis_url`

### 5. Apollo.io (For enrichment)
- Sign up: https://www.apollo.io/
- Get API key
- Add to `.env`: `APOLLO_API_KEY=your_key_here`

## Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Signal Collection APIs
SERPAPI_API_KEY="your_serpapi_key"
SCRAPERAPI_KEY="your_scraperapi_key"
CRUNCHBASE_API_KEY="your_crunchbase_key"

# Enrichment
APOLLO_API_KEY="your_apollo_key"

# Redis (for queue and rate limiting)
REDIS_URL="redis://default:password@host:6379"

# Webhook Security
WEBHOOK_SECRET="your_random_secret_here"

# Cron Security (Vercel)
CRON_SECRET="your_random_secret_here"

# Default Settings
DEFAULT_LOCATION="Brazil"
LOG_LEVEL="info"
```

## Signal Collection Strategies

### Strategy 1: SerpAPI (Recommended)
- **Pros**: Most reliable, handles CAPTCHAs, high success rate
- **Cons**: More expensive
- **Best for**: Production environments, high-volume collection

```typescript
// Automatically used when SERPAPI_API_KEY is set
const ingestion = new ProductionSignalIngestion();
await ingestion.ingestJobPostings({
  keywords: ['Head of Engineering'],
  location: 'Brazil',
  sources: ['serpapi'], // Explicitly use SerpAPI
});
```

### Strategy 2: ScraperAPI
- **Pros**: Good for direct scraping, handles proxies
- **Cons**: Requires more configuration
- **Best for**: When you need direct access to job sites

```typescript
await ingestion.ingestJobPostings({
  keywords: ['VP of Sales'],
  location: 'Brazil',
  sources: ['scraperapi'],
});
```

### Strategy 3: RSS Feeds
- **Pros**: Free, reliable, no rate limits
- **Cons**: Limited data, not all sites have RSS
- **Best for**: Supplementing other sources

```typescript
await ingestion.ingestJobPostings({
  keywords: ['Director'],
  location: 'Brazil',
  sources: ['rss'],
});
```

### Strategy 4: Multi-Source (Recommended)
- **Pros**: Highest coverage, redundancy
- **Cons**: More API costs
- **Best for**: Maximum signal collection

```typescript
await ingestion.ingestJobPostings({
  keywords: ['Head of Engineering', 'VP of Sales'],
  location: 'Brazil',
  sources: ['serpapi', 'scraperapi', 'rss'], // Use all sources
});
```

## Queue System Setup

The queue system processes signals in the background:

```typescript
// Add job to queue (non-blocking)
await ingestion.ingestJobPostings({
  keywords: ['CTO'],
  location: 'Brazil',
  useQueue: true, // Process in background
});

// Check queue stats
const stats = await ingestion.getQueueStats();
console.log(stats); // { waiting: 5, active: 2, completed: 100, failed: 1 }
```

## Scheduled Collection

### Option 1: Vercel Cron (Recommended)

Already configured in `vercel.json`:
- Runs every 6 hours
- Endpoint: `/api/cron/ingest`
- Protected by `CRON_SECRET`

### Option 2: Node Cron (For self-hosted)

```typescript
import { SignalScheduler } from '@/lib/signals/scheduler';

const scheduler = new SignalScheduler();
scheduler.start(); // Starts scheduled jobs
```

## Webhook Integration

Set up webhooks to receive signals from external sources:

1. **Configure webhook secret**:
   ```bash
   WEBHOOK_SECRET="your_secret_here"
   ```

2. **Send webhook**:
   ```bash
   curl -X POST https://your-domain.com/api/webhooks/signals \
     -H "Content-Type: application/json" \
     -H "X-Webhook-Signature: $(echo -n "$body" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)" \
     -H "X-Signal-Source: external_api" \
     -d '{
       "type": "funding",
       "company_name": "TechCorp",
       "amount": 5000000,
       "round": "Series A",
       "date": "2024-01-15"
     }'
   ```

## Rate Limiting

Rate limiting is automatically handled:

```typescript
// Check rate limit
const rateLimiter = new RateLimiter();
const allowed = await rateLimiter.checkLimit('serpapi:linkedin', 50, 60); // 50 per minute

// Wait for rate limit
await rateLimiter.waitForLimit('serpapi:linkedin', 50, 60);
```

## Monitoring

### Logs

Logs are automatically written to:
- Console (development)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

### Metrics

Track collection metrics:
```typescript
const { signals, stats } = await ingestion.ingestJobPostings({...});
console.log(stats);
// {
//   totalCollected: 150,
//   duplicates: 20,
//   errors: 2,
//   sources: { serpapi: 100, scraperapi: 50 }
// }
```

## Production Checklist

- [ ] Set up all required API keys
- [ ] Configure Redis for queue and rate limiting
- [ ] Set up database with connection pooling
- [ ] Configure webhook secret
- [ ] Set up Vercel Cron or alternative scheduler
- [ ] Configure logging and monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Test signal collection with real APIs
- [ ] Monitor API usage and costs
- [ ] Set up alerts for collection failures

## Cost Estimation

**Monthly costs for 10,000 signals:**

- SerpAPI: ~$50 (5,000 searches)
- ScraperAPI: ~$49 (10,000 requests)
- Crunchbase: ~$100 (varies)
- Apollo: ~$49 (basic plan)
- Redis: ~$10 (Upstash free tier or Vercel KV)
- **Total: ~$258/month**

**Optimization tips:**
- Use RSS feeds for free signals
- Cache API responses
- Use queue to batch requests
- Monitor and optimize rate limits

## Troubleshooting

### Signals not being collected

1. Check API keys are set correctly
2. Verify rate limits aren't exceeded
3. Check logs for errors
4. Test API keys directly

### Queue not processing

1. Verify Redis connection
2. Check queue stats: `GET /api/queue/stats`
3. Check worker logs

### High API costs

1. Reduce collection frequency
2. Use RSS feeds where possible
3. Implement better caching
4. Optimize deduplication

## Support

For issues:
1. Check logs in `logs/` directory
2. Review API provider dashboards
3. Check queue statistics
4. Monitor error rates




