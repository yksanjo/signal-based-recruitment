import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        totalSignals: 0,
        processedSignals: 0,
        activeBuckets: 0,
        totalCandidates: 0,
      });
    }

    const [totalSignals, processedSignals, activeBuckets, totalCandidates] = await Promise.all([
      prisma.signal.count().catch(() => 0),
      prisma.signal.count({ where: { processed: true } }).catch(() => 0),
      prisma.actionBucket.count({ where: { active: true } }).catch(() => 0),
      prisma.candidateProfile.count().catch(() => 0),
    ]);

    return NextResponse.json({
      totalSignals,
      processedSignals,
      activeBuckets,
      totalCandidates,
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    // Return default values instead of error to prevent client-side crashes
    return NextResponse.json({
      totalSignals: 0,
      processedSignals: 0,
      activeBuckets: 0,
      totalCandidates: 0,
    });
  }
}




