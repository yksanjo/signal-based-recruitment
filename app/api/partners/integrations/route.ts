import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';

/**
 * Partner Integrations API
 * Manage partner integrations (LinkedIn, Indeed)
 */

// GET /api/partners/integrations - List integrations
export async function GET(request: NextRequest) {
  try {
    const integrations = await prisma.partnerIntegration.findMany({
      include: {
        _count: {
          select: {
            jobPostings: true,
            syncLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Don't expose sensitive data
    const safeIntegrations = integrations.map((integration) => ({
      id: integration.id,
      partner: integration.partner,
      status: integration.status,
      lastSyncAt: integration.lastSyncAt,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      jobPostingCount: integration._count.jobPostings,
      syncLogCount: integration._count.syncLogs,
      hasApiKey: !!integration.apiKey,
      hasAccessToken: !!integration.accessToken,
    }));

    return NextResponse.json({ integrations: safeIntegrations });
  } catch (error: any) {
    logger.error('Failed to fetch integrations', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

// POST /api/partners/integrations - Create integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partner, apiKey, accessToken, refreshToken, config } = body;

    if (!partner || (!apiKey && !accessToken)) {
      return NextResponse.json(
        { error: 'Partner and credentials are required' },
        { status: 400 }
      );
    }

    const integration = await prisma.partnerIntegration.create({
      data: {
        partner: partner as 'LINKEDIN' | 'INDEED' | 'GLASSDOOR',
        status: 'PENDING',
        apiKey: apiKey || undefined,
        accessToken: accessToken || undefined,
        refreshToken: refreshToken || undefined,
        config: config || {},
      },
    });

    logger.info('Integration created', { integrationId: integration.id, partner });

    return NextResponse.json({ integration: { id: integration.id, partner, status: integration.status } }, { status: 201 });
  } catch (error: any) {
    logger.error('Failed to create integration', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}

