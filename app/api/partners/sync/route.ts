import { NextRequest, NextResponse } from 'next/server';
import { PartnerSyncService } from '@/lib/partners/sync-service';
import logger from '@/lib/monitoring/logger';

/**
 * Partner Sync API
 * Handles job posting synchronization with partner platforms
 */

// POST /api/partners/sync - Trigger sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      direction = 'bidirectional',
      partner,
      signalIds,
      limit,
      resolveConflicts = 'newest',
    } = body;

    const syncService = new PartnerSyncService();
    let result;

    if (direction === 'pull') {
      result = await syncService.syncFromPartners({ partner, limit });
    } else if (direction === 'push') {
      result = await syncService.syncToPartners({ partner, signalIds, limit });
    } else {
      result = await syncService.bidirectionalSync({ partner, resolveConflicts });
    }

    logger.info('Partner sync completed', { direction, partner, result });

    return NextResponse.json({
      success: result.success,
      ...result,
    });
  } catch (error: any) {
    logger.error('Partner sync failed', { error: error.message, stack: error.stack });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/partners/sync - Get sync status
export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/db');
    const { searchParams } = new URL(request.url);
    const partner = searchParams.get('partner');

    const integrations = await prisma.partnerIntegration.findMany({
      where: {
        ...(partner && { partner: partner as any }),
      },
      include: {
        syncLogs: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
        _count: {
          select: {
            jobPostings: true,
          },
        },
      },
    });

    return NextResponse.json({
      integrations: integrations.map((integration) => ({
        id: integration.id,
        partner: integration.partner,
        status: integration.status,
        lastSyncAt: integration.lastSyncAt,
        jobPostingCount: integration._count.jobPostings,
        recentSyncs: integration.syncLogs,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch sync status', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}

