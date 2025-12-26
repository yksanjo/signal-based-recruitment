import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';

/**
 * Individual Candidate API
 * GET, PUT, DELETE operations for a specific candidate
 */

// GET /api/candidates/[id] - Get candidate by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: params.id },
      include: {
        applications: {
          include: {
            jobPosting: {
              include: {
                integration: true,
                signal: true,
              },
            },
          },
          orderBy: { appliedAt: 'desc' },
        },
        bucket: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ candidate });
  } catch (error: any) {
    logger.error('Failed to fetch candidate', { error: error.message, id: params.id });
    return NextResponse.json(
      { error: 'Failed to fetch candidate' },
      { status: 500 }
    );
  }
}

// PUT /api/candidates/[id] - Update candidate
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      likelihoodToMove,
    } = body;

    const candidate = await prisma.candidateProfile.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(title !== undefined && { title }),
        ...(company !== undefined && { company }),
        ...(location !== undefined && { location }),
        ...(linkedInUrl !== undefined && { linkedInUrl }),
        ...(email !== undefined && { email }),
        ...(skills && { skills }),
        ...(bucketId !== undefined && { bucketId }),
        ...(likelihoodToMove !== undefined && { likelihoodToMove }),
      },
    });

    logger.info('Candidate updated', { candidateId: candidate.id });

    return NextResponse.json({ candidate });
  } catch (error: any) {
    logger.error('Failed to update candidate', { error: error.message, id: params.id });
    return NextResponse.json(
      { error: 'Failed to update candidate' },
      { status: 500 }
    );
  }
}

// DELETE /api/candidates/[id] - Delete candidate
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.candidateProfile.delete({
      where: { id: params.id },
    });

    logger.info('Candidate deleted', { candidateId: params.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to delete candidate', { error: error.message, id: params.id });
    return NextResponse.json(
      { error: 'Failed to delete candidate' },
      { status: 500 }
    );
  }
}

