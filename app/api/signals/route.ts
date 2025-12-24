import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Always return an array, never an error object
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.log('No DATABASE_URL, returning empty array');
      return NextResponse.json([], { status: 200 });
    }

    // Dynamically import prisma to avoid initialization errors
    let prisma;
    try {
      const dbModule = await import('@/lib/db');
      prisma = dbModule.prisma;
    } catch (importError: any) {
      console.error('Failed to import prisma:', importError);
      return NextResponse.json([], { status: 200 });
    }
    
    // Check if prisma is properly initialized
    if (!prisma || typeof prisma !== 'object' || !prisma.signal) {
      console.log('Prisma not initialized, returning empty array');
      return NextResponse.json([], { status: 200 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    try {
      const signals = await prisma.signal.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          enrichments: true,
        },
      }).catch((err: any) => {
        console.error('Prisma query error:', err);
        return [];
      });

      // Ensure signals is always an array
      const signalsArray = Array.isArray(signals) ? signals : [];
      
      // Map to response format, ensuring all fields are safe
      const mappedSignals = signalsArray.map((s: any) => ({
        id: s?.id || '',
        type: s?.type || 'JOB_POSTING',
        source: s?.source || 'unknown',
        title: s?.title || null,
        companyName: s?.companyName || 'Unknown Company',
        companyUrl: s?.companyUrl || null,
        jobUrl: s?.jobUrl || null,
        location: s?.location || null,
        postedDate: s?.postedDate || null,
        processed: s?.processed || false,
      }));

      return NextResponse.json(mappedSignals, { status: 200 });
    } catch (dbError: any) {
      console.error('Database error fetching signals:', dbError);
      return NextResponse.json([], { status: 200 });
    }
  } catch (error: any) {
    console.error('Unexpected error fetching signals:', error);
    // Always return empty array with 200 status to prevent client-side crashes
    return NextResponse.json([], { status: 200 });
  }
}

