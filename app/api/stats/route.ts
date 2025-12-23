import { NextResponse } from 'next/server';

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
      }, { status: 200 });
    }

    // Dynamically import prisma to avoid initialization errors
    const { prisma } = await import('@/lib/db');

    // Check if prisma is properly initialized
    if (!prisma || !prisma.signal) {
      return NextResponse.json({
        totalSignals: 0,
        processedSignals: 0,
        activeBuckets: 0,
        totalCandidates: 0,
      }, { status: 200 });
    }

    try {
      const [totalSignals, processedSignals, activeBuckets, totalCandidates] = await Promise.all([
        prisma.signal.count().catch(() => 0),
        prisma.signal.count({ where: { processed: true } }).catch(() => 0),
        prisma.actionBucket?.count({ where: { active: true } }).catch(() => 0) || Promise.resolve(0),
        prisma.candidateProfile?.count().catch(() => 0) || Promise.resolve(0),
      ]);

      return NextResponse.json({
        totalSignals: totalSignals || 0,
        processedSignals: processedSignals || 0,
        activeBuckets: activeBuckets || 0,
        totalCandidates: totalCandidates || 0,
      }, { status: 200 });
    } catch (dbError: any) {
      console.error('Database error fetching stats:', dbError);
      return NextResponse.json({
        totalSignals: 0,
        processedSignals: 0,
        activeBuckets: 0,
        totalCandidates: 0,
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    // Always return default values with 200 status to prevent client-side crashes
    return NextResponse.json({
      totalSignals: 0,
      processedSignals: 0,
      activeBuckets: 0,
      totalCandidates: 0,
    }, { status: 200 });
  }
}




