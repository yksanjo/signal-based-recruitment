import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Always return a valid stats object, never an error
  const defaultStats = {
    totalSignals: 0,
    processedSignals: 0,
    activeBuckets: 0,
    totalCandidates: 0,
  };

  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.log('No DATABASE_URL, returning default stats');
      return NextResponse.json(defaultStats, { status: 200 });
    }

    // Dynamically import prisma to avoid initialization errors
    let prisma;
    try {
      const dbModule = await import('@/lib/db');
      prisma = dbModule.prisma;
    } catch (importError: any) {
      console.error('Failed to import prisma:', importError);
      return NextResponse.json(defaultStats, { status: 200 });
    }

    // Check if prisma is properly initialized
    if (!prisma || typeof prisma !== 'object' || !prisma.signal) {
      console.log('Prisma not initialized, returning default stats');
      return NextResponse.json(defaultStats, { status: 200 });
    }

    try {
      const [totalSignals, processedSignals, activeBuckets, totalCandidates] = await Promise.all([
        prisma.signal.count().catch(() => 0),
        prisma.signal.count({ where: { processed: true } }).catch(() => 0),
        prisma.actionBucket?.count({ where: { active: true } }).catch(() => 0) || Promise.resolve(0),
        prisma.candidateProfile?.count().catch(() => 0) || Promise.resolve(0),
      ]);

      // Ensure all values are numbers
      return NextResponse.json({
        totalSignals: Number(totalSignals) || 0,
        processedSignals: Number(processedSignals) || 0,
        activeBuckets: Number(activeBuckets) || 0,
        totalCandidates: Number(totalCandidates) || 0,
      }, { status: 200 });
    } catch (dbError: any) {
      console.error('Database error fetching stats:', dbError);
      return NextResponse.json(defaultStats, { status: 200 });
    }
  } catch (error: any) {
    console.error('Unexpected error fetching stats:', error);
    // Always return default values with 200 status to prevent client-side crashes
    return NextResponse.json(defaultStats, { status: 200 });
  }
}




