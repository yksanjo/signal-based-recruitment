import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(null, { status: 200 });
    }

    // Dynamically import prisma
    let prisma;
    try {
      const dbModule = await import('@/lib/db');
      prisma = dbModule.prisma;
    } catch (importError: any) {
      console.error('Failed to import prisma:', importError);
      return NextResponse.json(null, { status: 200 });
    }

    // Check if prisma is properly initialized
    if (!prisma || typeof prisma !== 'object' || !prisma.subscription) {
      return NextResponse.json(null, { status: 200 });
    }

    // Get or create a default subscription (for demo purposes)
    // In production, this would be tied to a user ID
    let subscription = await prisma.subscription.findFirst({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    }).catch(() => null);

    if (!subscription) {
      // Create a free subscription by default
      subscription = await prisma.subscription.create({
        data: {
          plan: 'free',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      }).catch(() => null);
    }

    if (!subscription) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(null, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Dynamically import prisma
    let prisma;
    try {
      const dbModule = await import('@/lib/db');
      prisma = dbModule.prisma;
    } catch (importError: any) {
      console.error('Failed to import prisma:', importError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // Check if prisma is properly initialized
    if (!prisma || typeof prisma !== 'object' || !prisma.subscription) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { plan, status } = body;

    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: {
        id: body.id || 'default',
      },
      create: {
        plan: plan || 'free',
        status: status || 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        plan,
        status,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }).catch((err: any) => {
      console.error('Database error:', err);
      return null;
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
      },
    });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription', details: error.message },
      { status: 500 }
    );
  }
}




