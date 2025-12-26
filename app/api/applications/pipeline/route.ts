import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';

/**
 * Application Pipeline API
 * Provides pipeline/kanban board view of applications
 */

// GET /api/applications/pipeline - Get pipeline view
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobPostingId = searchParams.get('jobPostingId');

    const where: any = {};
    if (jobPostingId) {
      where.jobPostingId = jobPostingId;
    }

    // Group applications by status
    const applications = await prisma.application.findMany({
      where,
      include: {
        candidate: true,
        jobPosting: {
          include: {
            signal: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    // Organize into pipeline stages
    const pipeline = {
      APPLIED: applications.filter((app) => app.status === 'APPLIED'),
      REVIEWING: applications.filter((app) => app.status === 'REVIEWING'),
      SCREENING: applications.filter((app) => app.status === 'SCREENING'),
      INTERVIEWING: applications.filter((app) => app.status === 'INTERVIEWING'),
      OFFERED: applications.filter((app) => app.status === 'OFFERED'),
      ACCEPTED: applications.filter((app) => app.status === 'ACCEPTED'),
      REJECTED: applications.filter((app) => app.status === 'REJECTED'),
      WITHDRAWN: applications.filter((app) => app.status === 'WITHDRAWN'),
    };

    // Calculate statistics
    const stats = {
      total: applications.length,
      byStatus: {
        APPLIED: pipeline.APPLIED.length,
        REVIEWING: pipeline.REVIEWING.length,
        SCREENING: pipeline.SCREENING.length,
        INTERVIEWING: pipeline.INTERVIEWING.length,
        OFFERED: pipeline.OFFERED.length,
        ACCEPTED: pipeline.ACCEPTED.length,
        REJECTED: pipeline.REJECTED.length,
        WITHDRAWN: pipeline.WITHDRAWN.length,
      },
      active: applications.filter(
        (app) => !['REJECTED', 'WITHDRAWN', 'ACCEPTED'].includes(app.status)
      ).length,
    };

    return NextResponse.json({
      pipeline,
      stats,
    });
  } catch (error: any) {
    logger.error('Failed to fetch pipeline', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to fetch pipeline' },
      { status: 500 }
    );
  }
}

