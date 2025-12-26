import { NextRequest, NextResponse } from 'next/server';
import { exportPersonalData, logDataAccess } from '@/lib/security/gdpr';
import logger from '@/lib/monitoring/logger';

/**
 * GDPR Data Export Endpoint
 * Implements Right to Access
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, candidateId } = body;

    if (!email && !candidateId) {
      return NextResponse.json(
        { error: 'Email or candidateId is required' },
        { status: 400 }
      );
    }

    const data = await exportPersonalData({ email, candidateId });

    // Log data access
    await logDataAccess('export', 'candidate', candidateId || email || '');

    logger.info('GDPR export request processed', { email, candidateId });

    return NextResponse.json({
      success: true,
      data,
      exportedAt: new Date(),
    });
  } catch (error: any) {
    logger.error('GDPR export failed', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to export personal data' },
      { status: 500 }
    );
  }
}

