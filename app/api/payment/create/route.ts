import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  pro: 9900, // $99.00 in cents
  enterprise: 49900, // $499.00 in cents
};

export async function POST(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { error: 'Failed to create payment', details: error.message },
      { status: 500 }
    );
  }
}




