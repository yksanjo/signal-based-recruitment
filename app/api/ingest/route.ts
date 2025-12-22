import { NextRequest, NextResponse } from 'next/server';
import { ProductionSignalIngestion } from '@/lib/signals/ingestion-v2';
import logger from '@/lib/monitoring/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords, location, daysBack, useQueue, sources } = body;

    const ingestion = new ProductionSignalIngestion();
    const { signals, stats } = await ingestion.ingestJobPostings({
      keywords,
      location,
      daysBack,
      useQueue: useQueue || false,
      sources,
    });

    logger.info('Signals ingested via /api/ingest', stats);

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
    logger.error('Ingestion error', { error: error.message });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to ingest signals' },
      { status: 500 }
    );
  }
}

