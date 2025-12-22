import { NextRequest, NextResponse } from 'next/server';
import { ProductionSignalIngestion } from '@/lib/signals/ingestion-v2';
import { FundingSignalCollector } from '@/lib/signals/collectors/funding';
import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';
import crypto from 'crypto';

/**
 * Webhook endpoint for external signal sources
 * Supports webhook authentication and validation
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (if provided)
    const signature = request.headers.get('x-webhook-signature');
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const body = await request.text();
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const data = await request.json();
    const source = request.headers.get('x-signal-source') || 'webhook';

    // Process different signal types
    if (data.type === 'funding') {
      const fundingCollector = new FundingSignalCollector();
      const signals = await fundingCollector.collectFromWebhook(data);

      for (const signal of signals) {
        const existing = await prisma.signal.findFirst({
          where: {
            type: 'FUNDING_ANNOUNCEMENT',
            companyName: signal.companyName,
            postedDate: signal.postedDate,
          },
        });

        if (!existing) {
          await prisma.signal.create({
            data: {
              type: 'FUNDING_ANNOUNCEMENT',
              source: source,
              companyName: signal.companyName,
              postedDate: signal.postedDate,
              rawData: signal.rawData,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        signalsReceived: signals.length,
      });
    }

    // Process job posting signals
    if (data.type === 'job_posting' || data.job_title) {
      const ingestion = new ProductionSignalIngestion();
      const { stats } = await ingestion.ingestJobPostings({
        keywords: data.keywords || [data.job_title],
        location: data.location,
        daysBack: data.days_back || 30,
      });

      return NextResponse.json({
        success: true,
        stats,
      });
    }

    return NextResponse.json(
      { error: 'Unknown signal type' },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error('Webhook processing error', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

