import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';

/**
 * Candidate Management API
 * Handles CRUD operations for candidate profiles
 */

// GET /api/candidates - List candidates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bucketId = searchParams.get('bucketId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (bucketId) {
      where.bucketId = bucketId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [candidates, total] = await Promise.all([
      prisma.candidateProfile.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          applications: {
            include: {
              jobPosting: {
                include: {
                  integration: true,
                },
              },
            },
          },
        },
      }),
      prisma.candidateProfile.count({ where }),
    ]);

    return NextResponse.json({
      candidates,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    logger.error('Failed to fetch candidates', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

// POST /api/candidates - Create candidate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      title,
      company,
      location,
      linkedInUrl,
      email,
      skills,
      bucketId,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidateProfile.create({
      data: {
        name,
        title,
        company,
        location,
        linkedInUrl,
        email,
        skills: skills || [],
        bucketId,
      },
    });

    logger.info('Candidate created', { candidateId: candidate.id });

    return NextResponse.json({ candidate }, { status: 201 });
  } catch (error: any) {
    logger.error('Failed to create candidate', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}

