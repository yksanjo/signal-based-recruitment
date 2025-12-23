import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const signals = await prisma.signal.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        enrichments: true,
      },
    });

    return NextResponse.json(signals.map(s => ({
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
  } catch (error: any) {
    console.error('Error fetching signals:', error);
    // Return empty array instead of error to prevent client-side crashes
    return NextResponse.json([]);
  }
}

