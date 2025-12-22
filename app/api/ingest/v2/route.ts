import { NextRequest, NextResponse } from 'next/server';
import { ProductionSignalIngestion } from '@/lib/signals/ingestion-v2';
import logger from '@/lib/monitoring/logger';

/**
 * Production-grade signal ingestion endpoint
 * Supports multiple collectors, rate limiting, and queue processing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      keywords,
      location,
      daysBack,
      useQueue = false,
      sources,
      signalType = 'job_posting',
    } = body;

    const ingestion = new ProductionSignalIngestion();

    if (signalType === 'funding') {
      const signals = await ingestion.ingestFundingSignals({
        minAmount: body.minAmount,
        rounds: body.rounds,
        daysBack,
      });

      logger.info('Funding signals ingested', { count: signals.length });

      return NextResponse.json({
        success: true,
        count: signals.length,
        signals: signals.map(s => ({
          id: s.id,
          companyName: s.companyName,
          type: s.type,
        })),
      });
    }

    // Job posting ingestion
    const { signals, stats } = await ingestion.ingestJobPostings({
      keywords,
      location,
      daysBack,
      useQueue,
      sources,
    });

    logger.info('Signals ingested', stats);

    return NextResponse.json({
      success: true,
      count: signals.length,
      stats,
      signals: signals.map(s => ({
        id: s.id,
        companyName: s.companyName,
        title: s.title,
        source: s.source,
      })),
    });
  } catch (error: any) {
    logger.error('Ingestion error', { error: error.message, stack: error.stack });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

