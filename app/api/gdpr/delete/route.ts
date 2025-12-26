import { NextRequest, NextResponse } from 'next/server';
import { deletePersonalData } from '@/lib/security/gdpr';
import logger from '@/lib/monitoring/logger';

/**
 * GDPR Data Deletion Endpoint
 * Implements Right to be Forgotten
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, candidateId, userId } = body;

    if (!email && !candidateId && !userId) {
      return NextResponse.json(
        { error: 'At least one identifier is required' },
        { status: 400 }
      );
    }

    const result = await deletePersonalData({ email, candidateId, userId });

    logger.info('GDPR deletion request processed', { email, candidateId, userId });

    return NextResponse.json({
      success: result.success,
      deletedRecords: result.deletedRecords,
      message: 'Personal data has been deleted',
    });
  } catch (error: any) {
    logger.error('GDPR deletion failed', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to delete personal data' },
      { status: 500 }
    );
  }
}

