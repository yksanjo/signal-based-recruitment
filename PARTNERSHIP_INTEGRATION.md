# Partnership Integration Documentation

This document describes the LinkedIn and Indeed partnership integrations for the Signal-Based Recruitment System.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [LinkedIn Integration](#linkedin-integration)
4. [Indeed Integration](#indeed-integration)
5. [API Endpoints](#api-endpoints)
6. [Setup Guide](#setup-guide)
7. [Security & Compliance](#security--compliance)
8. [Troubleshooting](#troubleshooting)

## Overview

The partnership integration system enables bidirectional synchronization of job postings and candidate applications with LinkedIn and Indeed platforms. This allows the Signal-Based Recruitment System to function as an ATS (Applicant Tracking System) compatible with major job platforms.

### Key Features

- **Bidirectional Job Sync**: Post jobs to and pull jobs from LinkedIn/Indeed
- **Application Management**: Receive and manage applications from partner platforms
- **Webhook Support**: Real-time updates via webhooks
- **Conflict Resolution**: Automatic handling of data conflicts
- **Monitoring Dashboard**: Track sync status and errors
- **GDPR/CCPA Compliance**: Data deletion and export capabilities

## Architecture

### Partner Integration Flow

```
┌─────────────────┐
│  Signal System  │
└────────┬────────┘
         │
         ├──► LinkedIn API Client
         │    ├── OAuth 2.0 Auth
         │    ├── Job Posting API
         │    └── Candidate Sync
         │
         ├──► Indeed API Client
         │    ├── API Key Auth
         │    ├── Job Posting API
         │    └── Application API
         │
         └──► Webhook Handlers
              ├── Signature Verification
              └── Event Processing
```

### Database Schema

The integration uses the following Prisma models:

- `PartnerIntegration`: Stores partner credentials and configuration
- `PartnerJobPosting`: Links signals to partner job postings
- `Application`: Tracks applications from partner platforms
- `PartnerSyncLog`: Logs sync operations

## LinkedIn Integration

### Prerequisites

1. LinkedIn Developer Account
2. LinkedIn Application registered in [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
3. OAuth 2.0 credentials (Client ID, Client Secret)
4. LinkedIn Talent Solutions partnership (for full features)

### Setup Steps

1. **Register Application**
   - Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
   - Create a new application
   - Note your Client ID and Client Secret
   - Add redirect URI: `https://yourdomain.com/api/auth/linkedin/callback`

2. **Configure Environment Variables**
   ```env
   LINKEDIN_CLIENT_ID=your_client_id
   LINKEDIN_CLIENT_SECRET=your_client_secret
   LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/auth/linkedin/callback
   LINKEDIN_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **OAuth Flow**
   - Navigate to `/api/auth/linkedin?action=authorize`
   - User authorizes application
   - System receives OAuth callback
   - Access token stored in database (encrypted)

4. **Webhook Configuration**
   - In LinkedIn Developer Portal, configure webhook URL
   - Webhook URL: `https://yourdomain.com/api/webhooks/linkedin`
   - Verify webhook secret matches `LINKEDIN_WEBHOOK_SECRET`

### API Capabilities

- **Job Search**: Search for jobs using LinkedIn Jobs API
- **Job Posting**: Post jobs to LinkedIn (requires partnership)
- **Candidate Sync**: Sync candidate profiles via Recruiter System Connect (RSC)
- **Application Management**: Receive applications via webhooks

### Webhook Events

- `JOB_APPLICATION`: New application received
- `JOB_STATUS_CHANGE`: Job posting status changed

## Indeed Integration

### Prerequisites

1. Indeed Partner Program membership
2. API credentials from Indeed
3. Partner ID from Indeed

### Setup Steps

1. **Apply for Partner Program**
   - Contact Indeed Partner Program team
   - Complete partnership application
   - Receive API credentials

2. **Configure Environment Variables**
   ```env
   INDEED_API_KEY=your_api_key
   INDEED_PARTNER_ID=your_partner_id
   INDEED_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **Create Integration**
   ```bash
   POST /api/partners/integrations
   {
     "partner": "INDEED",
     "apiKey": "your_api_key"
   }
   ```

4. **Webhook Configuration**
   - Configure webhook URL in Indeed dashboard
   - Webhook URL: `https://yourdomain.com/api/webhooks/indeed`
   - Verify webhook secret matches `INDEED_WEBHOOK_SECRET`

### API Capabilities

- **Job Search**: Search for jobs using Indeed API
- **Job Posting**: Post jobs to Indeed (requires partnership)
- **Indeed Apply**: Receive applications via Indeed Apply
- **Disposition Sync**: Sync application status updates

### Webhook Events

- `application.received`: New application received
- `application.status_changed`: Application status updated
- `job.status_changed`: Job posting status changed

## API Endpoints

### Partner Integrations

- `GET /api/partners/integrations` - List all integrations
- `POST /api/partners/integrations` - Create new integration
- `GET /api/partners/integrations/[id]` - Get integration details

### Sync Operations

- `POST /api/partners/sync` - Trigger sync operation
  ```json
  {
    "direction": "bidirectional", // "pull", "push", or "bidirectional"
    "partner": "LINKEDIN", // Optional: filter by partner
    "limit": 100, // Optional: limit number of records
    "resolveConflicts": "newest" // "ours", "theirs", or "newest"
  }
  ```

- `GET /api/partners/sync` - Get sync status

### Monitoring

- `GET /api/partners/monitoring` - Get monitoring dashboard data
  - Query params: `partner`, `days` (default: 7)

### Candidates

- `GET /api/candidates` - List candidates
- `POST /api/candidates` - Create candidate
- `GET /api/candidates/[id]` - Get candidate details
- `PUT /api/candidates/[id]` - Update candidate
- `DELETE /api/candidates/[id]` - Delete candidate

### Applications

- `GET /api/applications` - List applications
- `POST /api/applications` - Create application
- `GET /api/applications/[id]` - Get application details
- `PUT /api/applications/[id]` - Update application status
- `GET /api/applications/pipeline` - Get pipeline/kanban view

### GDPR/Compliance

- `POST /api/gdpr/delete` - Delete personal data (Right to be Forgotten)
- `POST /api/gdpr/export` - Export personal data (Right to Access)

## Setup Guide

### 1. Database Migration

Run Prisma migrations to create partner integration tables:

```bash
npx prisma generate
npx prisma migrate dev --name add_partner_integrations
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# LinkedIn
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=...
LINKEDIN_WEBHOOK_SECRET=...

# Indeed
INDEED_API_KEY=...
INDEED_PARTNER_ID=...
INDEED_WEBHOOK_SECRET=...

# Security
ENCRYPTION_KEY=your-32-byte-key-here
```

### 3. LinkedIn OAuth Setup

1. Navigate to `/api/auth/linkedin?action=authorize`
2. Complete OAuth flow
3. Integration will be created automatically

### 4. Indeed Integration Setup

```bash
curl -X POST http://localhost:3000/api/partners/integrations \
  -H "Content-Type: application/json" \
  -d '{
    "partner": "INDEED",
    "apiKey": "your_api_key"
  }'
```

### 5. Test Sync

```bash
curl -X POST http://localhost:3000/api/partners/sync \
  -H "Content-Type: application/json" \
  -d '{
    "direction": "pull",
    "partner": "LINKEDIN",
    "limit": 10
  }'
```

## Security & Compliance

### Encryption

API keys and tokens are encrypted at rest using AES-256-GCM. The encryption key is stored in `ENCRYPTION_KEY` environment variable.

### GDPR/CCPA Compliance

The system implements:

- **Right to be Forgotten**: `POST /api/gdpr/delete`
- **Right to Access**: `POST /api/gdpr/export`
- **Data Anonymization**: Automatic anonymization after retention period
- **Audit Logging**: All data access is logged

### Webhook Security

Webhooks are secured with HMAC SHA256 signature verification. Always verify webhook signatures before processing events.

### Rate Limiting

Partner APIs have rate limits. The system implements:
- Automatic rate limiting per partner
- Retry logic with exponential backoff
- Queue-based processing for bulk operations

## Troubleshooting

### LinkedIn OAuth Issues

**Problem**: OAuth callback fails
- **Solution**: Verify redirect URI matches exactly in LinkedIn Developer Portal
- Check that `LINKEDIN_REDIRECT_URI` matches the configured redirect URI

**Problem**: Token refresh fails
- **Solution**: Ensure `LINKEDIN_CLIENT_SECRET` is set correctly
- Check token expiration and refresh token validity

### Indeed API Issues

**Problem**: API authentication fails
- **Solution**: Verify `INDEED_API_KEY` and `INDEED_PARTNER_ID` are correct
- Ensure partner program membership is active

**Problem**: Webhook not receiving events
- **Solution**: Verify webhook URL is accessible
- Check webhook secret matches `INDEED_WEBHOOK_SECRET`
- Ensure webhook is verified in Indeed dashboard

### Sync Issues

**Problem**: Sync fails with rate limit errors
- **Solution**: Reduce sync frequency or limit batch size
- Implement queue-based processing for large syncs

**Problem**: Conflicts not resolving correctly
- **Solution**: Check conflict resolution strategy
- Review sync logs for details: `GET /api/partners/monitoring`

### Database Issues

**Problem**: Migration fails
- **Solution**: Ensure PostgreSQL is running
- Check `DATABASE_URL` is correct
- Run `npx prisma migrate reset` if needed (⚠️ deletes data)

## Partnership Application Process

### LinkedIn Talent Solutions

1. Complete LinkedIn Developer Portal registration
2. Build and test integration in sandbox
3. Submit partnership application via LinkedIn Talent Solutions
4. Provide demo and technical documentation
5. Undergo compliance review

### Indeed Partner Program

1. Review Indeed ATS Partner Program requirements
2. Complete technical integration
3. Submit partnership application
4. Provide integration documentation
5. Complete certification process

## Support

For issues or questions:
- Check logs: `logs/error.log` and `logs/combined.log`
- Review monitoring dashboard: `GET /api/partners/monitoring`
- Check sync logs: `GET /api/partners/sync`

## Next Steps

1. ✅ Complete technical integration
2. ⏳ Test in sandbox environments
3. ⏳ Submit partnership applications
4. ⏳ Complete compliance review
5. ⏳ Deploy to production

