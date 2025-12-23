import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Database connectivity test endpoint
 * Tests all database operations to ensure everything works
 */
export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tests: {},
    errors: [],
  };

  try {
    // Test 1: Basic connection
    await prisma.$connect();
    results.tests.connection = '✅ Connected';

    // Test 2: Read operations
    const signalCount = await prisma.signal.count();
    results.tests.readSignals = `✅ Found ${signalCount} signals`;

    const subscriptionCount = await prisma.subscription.count();
    results.tests.readSubscriptions = `✅ Found ${subscriptionCount} subscriptions`;

    const paymentCount = await prisma.payment.count();
    results.tests.readPayments = `✅ Found ${paymentCount} payments`;

    // Test 3: Write operations
    const testSubscription = await prisma.subscription.create({
      data: {
        plan: 'test',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    results.tests.createSubscription = `✅ Created test subscription: ${testSubscription.id}`;

    // Test 4: Update operations
    await prisma.subscription.update({
      where: { id: testSubscription.id },
      data: { plan: 'test_updated' },
    });
    results.tests.updateSubscription = '✅ Updated subscription';

    // Test 5: Delete operations
    await prisma.subscription.delete({
      where: { id: testSubscription.id },
    });
    results.tests.deleteSubscription = '✅ Deleted test subscription';

    // Test 6: Complex queries
    const bucketsWithSignals = await prisma.actionBucket.findMany({
      include: {
        assignments: {
          include: {
            signal: true,
          },
        },
      },
    });
    results.tests.complexQuery = `✅ Complex query returned ${bucketsWithSignals.length} buckets`;

    // Test 7: Transactions
    await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          plan: 'transaction_test',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
        },
      });
      await tx.subscription.delete({ where: { id: sub.id } });
    });
    results.tests.transaction = '✅ Transaction test passed';

    results.status = 'success';
    results.message = 'All database tests passed!';

  } catch (error: any) {
    results.status = 'error';
    results.message = 'Database test failed';
    results.errors.push({
      message: error.message,
      stack: error.stack,
    });
    results.tests.error = `❌ ${error.message}`;
  } finally {
    await prisma.$disconnect();
  }

  return NextResponse.json(results, {
    status: results.status === 'success' ? 200 : 500,
  });
}




