import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json([], { status: 200 });
    }

    // Dynamically import prisma to avoid initialization errors
    const { prisma } = await import('@/lib/db');
    
    // Check if prisma is properly initialized
    if (!prisma || !prisma.signal) {
      return NextResponse.json([], { status: 200 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    try {
      const signals = await prisma.signal.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          enrichments: true,
        },
      }).catch(() => []);

      return NextResponse.json((signals || []).map((s: any) => ({
        id: s.id,
        type: s.type,
        source: s.source,
        title: s.title,
        companyName: s.companyName,
        companyUrl: s.companyUrl,
        jobUrl: s.jobUrl,
        location: s.location,
        postedDate: s.postedDate,
        processed: s.processed,
      })));
    } catch (dbError: any) {
      console.error('Database error fetching signals:', dbError);
      return NextResponse.json([], { status: 200 });
    }
  } catch (error: any) {
    console.error('Error fetching signals:', error);
    // Always return empty array with 200 status to prevent client-side crashes
    return NextResponse.json([], { status: 200 });
  }
}

