import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';

/**
 * Partner Monitoring Dashboard API
 * Provides comprehensive monitoring data for partner integrations
 */

// GET /api/partners/monitoring - Get monitoring dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partner = searchParams.get('partner');
    const days = parseInt(searchParams.get('days') || '7');

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    // Get integrations
    const integrations = await prisma.partnerIntegration.findMany({
      where: {
        ...(partner && { partner: partner as any }),
      },
      include: {
        syncLogs: {
          where: {
            startedAt: {
              gte: dateFrom,
            },
          },
          orderBy: { startedAt: 'desc' },
        },
        jobPostings: {
          include: {
            applications: true,
          },
        },
        _count: {
          select: {
            jobPostings: true,
            syncLogs: true,
          },
        },
      },
    });

    // Calculate statistics
    const stats = {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.filter((i) => i.status === 'ACTIVE').length,
      totalJobPostings: integrations.reduce((sum, i) => sum + i._count.jobPostings, 0),
      totalApplications: integrations.reduce(
        (sum, i) => sum + i.jobPostings.reduce((s, j) => s + j.applications.length, 0),
        0
      ),
      recentSyncs: integrations.reduce((sum, i) => sum + i.syncLogs.length, 0),
      syncSuccessRate: calculateSyncSuccessRate(integrations),
    };

    // Get recent errors
    const recentErrors = await prisma.partnerSyncLog.findMany({
      where: {
        status: 'error',
        startedAt: {
          gte: dateFrom,
        },
        ...(partner && {
          integration: {
            partner: partner as any,
          },
        }),
      },
      include: {
        integration: true,
      },
      take: 20,
      orderBy: { startedAt: 'desc' },
    });

    // Get sync performance metrics
    const syncMetrics = integrations.map((integration) => {
      const recentSyncs = integration.syncLogs;
      const successfulSyncs = recentSyncs.filter((s) => s.status === 'success');
      const failedSyncs = recentSyncs.filter((s) => s.status === 'error');

      const totalRecords = recentSyncs.reduce((sum, s) => sum + s.recordsProcessed, 0);
      const totalFailed = recentSyncs.reduce((sum, s) => sum + s.recordsFailed, 0);

      return {
        partner: integration.partner,
        status: integration.status,
        lastSyncAt: integration.lastSyncAt,
        syncCount: recentSyncs.length,
        successCount: successfulSyncs.length,
        failureCount: failedSyncs.length,
        successRate: recentSyncs.length > 0 ? (successfulSyncs.length / recentSyncs.length) * 100 : 0,
        totalRecordsProcessed: totalRecords,
        totalRecordsFailed: totalFailed,
        averageRecordsPerSync: recentSyncs.length > 0 ? totalRecords / recentSyncs.length : 0,
        jobPostingCount: integration._count.jobPostings,
        applicationCount: integration.jobPostings.reduce((sum, j) => sum + j.applications.length, 0),
      };
    });

    return NextResponse.json({
      stats,
      integrations: integrations.map((integration) => ({
        id: integration.id,
        partner: integration.partner,
        status: integration.status,
        lastSyncAt: integration.lastSyncAt,
        createdAt: integration.createdAt,
        jobPostingCount: integration._count.jobPostings,
        syncLogCount: integration._count.syncLogs,
      })),
      syncMetrics,
      recentErrors: recentErrors.map((error) => ({
        id: error.id,
        partner: error.integration.partner,
        syncType: error.syncType,
        status: error.status,
        errorMessage: error.errorMessage,
        recordsProcessed: error.recordsProcessed,
        recordsFailed: error.recordsFailed,
        startedAt: error.startedAt,
        completedAt: error.completedAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch monitoring data', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}

function calculateSyncSuccessRate(integrations: any[]): number {
  const allSyncs = integrations.flatMap((i) => i.syncLogs);
  if (allSyncs.length === 0) return 100;

  const successfulSyncs = allSyncs.filter((s) => s.status === 'success');
  return (successfulSyncs.length / allSyncs.length) * 100;
}

