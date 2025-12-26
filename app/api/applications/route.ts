import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';

/**
 * Application Management API
 * Handles CRUD operations for job applications
 */

// GET /api/applications - List applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobPostingId = searchParams.get('jobPostingId');
    const candidateId = searchParams.get('candidateId');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (jobPostingId) where.jobPostingId = jobPostingId;
    if (candidateId) where.candidateId = candidateId;
    if (status) where.status = status;
    if (source) where.source = source;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { appliedAt: 'desc' },
        include: {
          jobPosting: {
            include: {
              integration: true,
              signal: true,
            },
          },
          candidate: true,
        },
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    logger.error('Failed to fetch applications', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// POST /api/applications - Create application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jobPostingId,
      candidateId,
      status = 'APPLIED',
      source = 'direct',
      notes,
      partnerData,
    } = body;

    if (!jobPostingId || !candidateId) {
      return NextResponse.json(
        { error: 'jobPostingId and candidateId are required' },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
        jobPostingId,
        candidateId,
        status,
        source,
        notes,
        partnerData,
      },
    });

    // Update application count on job posting
    await prisma.partnerJobPosting.update({
      where: { id: jobPostingId },
      data: {
        applicationCount: {
          increment: 1,
        },
      },
    });

    logger.info('Application created', { applicationId: application.id });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error: any) {
    logger.error('Failed to create application', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}

