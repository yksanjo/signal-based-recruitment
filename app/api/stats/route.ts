import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [totalSignals, processedSignals, activeBuckets, totalCandidates] = await Promise.all([
      prisma.signal.count(),
      prisma.signal.count({ where: { processed: true } }),
      prisma.actionBucket.count({ where: { active: true } }),
      prisma.candidateProfile.count(),
    ]);

    return NextResponse.json({
      totalSignals,
      processedSignals,
      activeBuckets,
      totalCandidates,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

