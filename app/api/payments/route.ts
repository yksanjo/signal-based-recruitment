import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json([], { status: 200 });
    }

    // Dynamically import prisma
    let prisma;
    try {
      const dbModule = await import('@/lib/db');
      prisma = dbModule.prisma;
    } catch (importError: any) {
      console.error('Failed to import prisma:', importError);
      return NextResponse.json([], { status: 200 });
    }

    // Check if prisma is properly initialized
    if (!prisma || typeof prisma !== 'object' || !prisma.payment) {
      return NextResponse.json([], { status: 200 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const payments = await prisma.payment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: true,
      },
    }).catch(() => []);

    return NextResponse.json(
      (payments || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency || 'usd',
        status: p.status,
        paymentMethod: p.paymentMethod,
        createdAt: p.createdAt,
        subscription: p.subscription ? {
          plan: p.subscription.plan,
          status: p.subscription.status,
        } : null,
      }))
    );
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json([], { status: 200 });
  }
}




