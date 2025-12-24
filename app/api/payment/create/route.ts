import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  pro: 99.00, // $99.00 (Float in database)
  enterprise: 499.00, // $499.00 (Float in database)
};

export async function POST(request: NextRequest) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    // Dynamically import prisma to avoid initialization errors
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
    const { plan } = body;

    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    const amount = PLAN_PRICES[plan];

    // Get or create subscription
    let subscription = await prisma.subscription.findFirst({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          plan: 'free',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount,
        currency: 'usd',
        status: 'PENDING',
        paymentMethod: 'stripe',
        metadata: {
          plan,
          createdAt: new Date().toISOString(),
        },
      },
    });

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // In production, you would:
    // 1. Create Stripe Payment Intent
    // 2. Return client secret for frontend
    // 3. Handle webhook for payment confirmation

    // For now, simulate successful payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        paymentIntentId: `pi_demo_${Date.now()}`,
        transactionId: `txn_${Date.now()}`,
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount,
        status: 'SUCCEEDED',
      },
      paymentIntent: {
        id: `pi_demo_${Date.now()}`,
        client_secret: `pi_demo_${Date.now()}_secret_demo`,
      },
      message: 'Payment processed successfully (demo mode)',
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    // Return user-friendly error message
    return NextResponse.json(
      { 
        error: 'Failed to create payment', 
        details: error.message || 'Unknown error',
        message: 'Please ensure DATABASE_URL is configured correctly'
      },
      { status: 500 }
    );
  }
}




