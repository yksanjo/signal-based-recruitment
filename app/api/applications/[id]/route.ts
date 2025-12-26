import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';

/**
 * Individual Application API
 * GET, PUT operations for a specific application
 */

// GET /api/applications/[id] - Get application by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        jobPosting: {
          include: {
            integration: true,
            signal: true,
          },
        },
        candidate: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ application });
  } catch (error: any) {
    logger.error('Failed to fetch application', { error: error.message, id: params.id });
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

// PUT /api/applications/[id] - Update application status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = [
      'APPLIED',
      'REVIEWING',
      'SCREENING',
      'INTERVIEWING',
      'OFFERED',
      'ACCEPTED',
      'REJECTED',
      'WITHDRAWN',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const application = await prisma.application.update({
      where: { id: params.id },
      data: {
        status,
        ...(notes !== undefined && { notes }),
      },
    });

    logger.info('Application status updated', {
      applicationId: application.id,
      status,
    });

    // If application is from a partner, sync status back
    if (application.source !== 'direct' && application.jobPostingId) {
      const jobPosting = await prisma.partnerJobPosting.findUnique({
        where: { id: application.jobPostingId },
        include: { integration: true },
      });

      if (jobPosting?.integration) {
        // Sync status to partner (LinkedIn/Indeed)
        // This would call the partner's API to update disposition
        logger.info('Syncing application status to partner', {
          applicationId: application.id,
          partner: jobPosting.integration.partner,
        });
      }
    }

    return NextResponse.json({ application });
  } catch (error: any) {
    logger.error('Failed to update application', { error: error.message, id: params.id });
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

