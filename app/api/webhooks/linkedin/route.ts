import { NextRequest, NextResponse } from 'next/server';
import { WebhookHandler } from '@/lib/partners/webhook-handler';
import logger from '@/lib/monitoring/logger';

/**
 * LinkedIn Webhook Endpoint
 * Handles webhook events from LinkedIn
 * 
 * Webhook events:
 * - JOB_APPLICATION: New application received
 * - JOB_STATUS_CHANGE: Job posting status changed
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-linkedin-signature') || '';
    const headers = Object.fromEntries(request.headers.entries());

    // Handle webhook verification challenge
    const challenge = request.nextUrl.searchParams.get('challenge');
    if (challenge) {
      const verifiedChallenge = await WebhookHandler.verifyWebhookChallenge('LINKEDIN', challenge);
      return NextResponse.json({ challenge: verifiedChallenge });
    }

    // Process webhook event
    await WebhookHandler.processLinkedInWebhook(payload, signature, headers);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('LinkedIn webhook error', { error: error.message, stack: error.stack });
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
    const verifiedChallenge = await WebhookHandler.verifyWebhookChallenge('LINKEDIN', challenge);
    return NextResponse.json({ challenge: verifiedChallenge });
  }
  return NextResponse.json({ message: 'LinkedIn webhook endpoint' });
}

