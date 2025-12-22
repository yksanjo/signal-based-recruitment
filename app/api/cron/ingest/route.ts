import { NextRequest, NextResponse } from 'next/server';
import { ProductionSignalIngestion } from '@/lib/signals/ingestion-v2';
import logger from '@/lib/monitoring/logger';

/**
 * Cron endpoint for scheduled signal collection
 * Protected by Vercel Cron secret
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel Cron)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ingestion = new ProductionSignalIngestion();

    // Collect job postings
    const { stats: jobStats } = await ingestion.ingestJobPostings({
      keywords: ['Head of Engineering', 'VP of Sales', 'Director', 'CTO'],
      location: process.env.DEFAULT_LOCATION || 'Brazil',
      daysBack: 7,
      useQueue: false, // Process immediately for cron
    });

    // Collect funding signals
    const fundingSignals = await ingestion.ingestFundingSignals({
      minAmount: 1000000,
      daysBack: 7,
    });

    logger.info('Cron job completed', {
      jobPostings: jobStats.totalCollected,
      fundingSignals: fundingSignals.length,
    });

    return NextResponse.json({
      success: true,
      jobPostings: jobStats.totalCollected,
      fundingSignals: fundingSignals.length,
      stats: jobStats,
    });
  } catch (error: any) {
    logger.error('Cron job failed', { error: error.message });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

