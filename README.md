# Signal-Based Recruitment Sourcing Platform

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://www.javascript.com/) [![GitHub stars](https://img.shields.io/github/stars/yksanjo/signal-based-recruitment?style=social)](https://github.com/yksanjo/signal-based-recruitment/stargazers) [![GitHub forks](https://img.shields.io/github/forks/yksanjo/signal-based-recruitment.svg)](https://github.com/yksanjo/signal-based-recruitment/network/members) [![GitHub issues](https://img.shields.io/github/issues/yksanjo/signal-based-recruitment.svg)](https://github.com/yksanjo/signal-based-recruitment/issues)
[![Last commit](https://img.shields.io/github/last-commit/yksanjo/signal-based-recruitment.svg)](https://github.com/yksanjo/signal-based-recruitment/commits/main)


A high-velocity event stream system for recruitment intelligence that replaces data-heavy scraping with signal-based architecture.

## Architecture

### 3-Layer System

1. **Signal Ingestion Layer (The "Sensor")**
   - Monitors high-intent public signals from LinkedIn, Indeed, Glassdoor
   - Tracks job postings, funding announcements, expansion signals
   - Lightweight, real-time event stream

2. **Logistics Engine (The "Sorter")**
   - Groups signals into "Action Buckets"
   - Filters by ICP (Ideal Customer Profile)
   - Clusters by company characteristics

3. **Orchestration Layer (The "Agent")**
   - Triggers workflows when signals hit thresholds
   - Fetches targeted candidate profiles on-demand
   - Scores candidates by likelihood to move

## Features

- ✅ Multi-source job posting ingestion (LinkedIn, Indeed, Glassdoor)
- ✅ Company enrichment via Apollo API
- ✅ ICP-based filtering and compliance checking
- ✅ Action bucket assignment (Poach, Scale, Skills Shift, Expansion, Funding Boost)
- ✅ On-demand candidate profile generation
- ✅ Likelihood-to-move scoring
- ✅ Real-time dashboard and visualization

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Apollo.io API key (optional, uses mock data if not provided)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/signal_recruitment"
APOLLO_API_KEY="your_apollo_api_key" # Optional
CLAY_API_KEY="your_clay_api_key" # Optional
```

3. Set up database:
```bash
npx prisma generate
npx prisma migrate dev
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The app is configured for Vercel with:
- Next.js 14 App Router
- PostgreSQL via Prisma
- Serverless API routes

## Usage

### 1. Configure ICP

Navigate to "ICP Config" tab and set your Ideal Customer Profile:
- Target country
- Excluded HQ countries
- Job title levels
- Industries
- Employee count limits

### 2. Ingest Signals

Go to "Signal Ingestion" tab:
- Enter keywords (e.g., "Head of Engineering, VP of Sales")
- Set location (e.g., "Brazil")
- Set days back (e.g., 30)
- Click "Ingest Signals"

### 3. View Action Buckets

Navigate to "Action Buckets" tab:
- See signals grouped into buckets
- Click on a bucket to view details
- Click "Trigger Workflow" to generate candidate profiles

### 4. Monitor Dashboard

The dashboard shows:
- Total signals processed
- Active buckets
- Candidate count
- Recent signals

## API Endpoints

- `POST /api/ingest` - Ingest job postings
- `GET /api/buckets` - Get all action buckets
- `POST /api/buckets` - Process signals into buckets
- `GET /api/buckets/[id]/candidates` - Get candidates for a bucket
- `POST /api/buckets/[id]/trigger` - Trigger workflow for a bucket
- `GET /api/stats` - Get platform statistics
- `GET /api/signals` - Get recent signals
- `GET /api/icp-config` - Get ICP configuration
- `POST /api/icp-config` - Update ICP configuration

## Production Considerations

### Scraping

The current implementation includes mock scrapers. For production:

1. **LinkedIn**: Use LinkedIn Jobs API or services like Apify, ScraperAPI
2. **Indeed**: Use Indeed's API or scraping services
3. **Glassdoor**: Use Glassdoor API or scraping services

### Enrichment

- Integrate with Apollo.io API for company enrichment
- Use Clay.com for additional data enrichment
- Consider caching enrichment data to reduce API calls

### Database

- Use connection pooling for production
- Set up database backups
- Monitor query performance

### Scaling

- Use Vercel's serverless functions (automatic)
- Consider background job processing (e.g., Vercel Cron)
- Implement rate limiting for API endpoints
- Cache frequently accessed data

## License

MIT




