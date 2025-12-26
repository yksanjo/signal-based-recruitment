import { NextRequest, NextResponse } from 'next/server';
import { WebhookHandler } from '@/lib/partners/webhook-handler';
import logger from '@/lib/monitoring/logger';

/**
 * Indeed Webhook Endpoint
 * Handles webhook events from Indeed
 * 
 * Webhook events:
 * - application.received: New application received
 * - application.status_changed: Application status updated
 * - job.status_changed: Job posting status changed
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-indeed-signature') || '';
    const headers = Object.fromEntries(request.headers.entries());

    // Handle webhook verification challenge
    const challenge = request.nextUrl.searchParams.get('challenge');
    if (challenge) {
      const verifiedChallenge = await WebhookHandler.verifyWebhookChallenge('INDEED', challenge);
      return NextResponse.json({ challenge: verifiedChallenge });
    }

    // Process webhook event
    await WebhookHandler.processIndeedWebhook(payload, signature, headers);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Indeed webhook error', { error: error.message, stack: error.stack });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');
  if (challenge) {
    const verifiedChallenge = await WebhookHandler.verifyWebhookChallenge('INDEED', challenge);
    return NextResponse.json({ challenge: verifiedChallenge });
  }
  return NextResponse.json({ message: 'Indeed webhook endpoint' });
}

