import { LinkedInAPIClient } from './linkedin/api-client';
import { IndeedAPIClient } from './indeed/api-client';
import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';

/**
 * Webhook Handler
 * Routes webhook events to appropriate partner handlers
 */
export class WebhookHandler {
  /**
   * Process LinkedIn webhook
   */
  static async processLinkedInWebhook(
    payload: string,
    signature: string,
    headers: Record<string, string>
  ): Promise<void> {
    try {
      // Get LinkedIn integration
      const integration = await prisma.partnerIntegration.findFirst({
        where: {
          partner: 'LINKEDIN',
          status: 'ACTIVE',
        },
      });

      if (!integration) {
        throw new Error('LinkedIn integration not found');
      }

      // Verify webhook signature
      const webhookSecret = process.env.LINKEDIN_WEBHOOK_SECRET || '';
      const client = new LinkedInAPIClient(
        {
          accessToken: integration.accessToken as string,
          refreshToken: integration.refreshToken as string | undefined,
        },
        integration.id
      );

      const isValid = client.verifyWebhookSignature(payload, signature, webhookSecret);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      // Parse and process event
      const event = JSON.parse(payload);
      await client.processWebhook(event);

      logger.info('LinkedIn webhook processed', { eventType: event.eventType });
    } catch (error: any) {
      logger.error('Failed to process LinkedIn webhook', { error: error.message });
      throw error;
    }
  }

  /**
   * Process Indeed webhook
   */
  static async processIndeedWebhook(
    payload: string,
    signature: string,
    headers: Record<string, string>
  ): Promise<void> {
    try {
      // Get Indeed integration
      const integration = await prisma.partnerIntegration.findFirst({
        where: {
          partner: 'INDEED',
          status: 'ACTIVE',
        },
      });

      if (!integration) {
        throw new Error('Indeed integration not found');
      }

      // Verify webhook signature
      const webhookSecret = process.env.INDEED_WEBHOOK_SECRET || '';
      const client = new IndeedAPIClient(
        {
          apiKey: integration.apiKey as string,
          partnerId: process.env.INDEED_PARTNER_ID,
        },
        integration.id
      );

      const isValid = client.verifyWebhookSignature(payload, signature, webhookSecret);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      // Parse and process event
      const event = JSON.parse(payload);
      await client.processWebhook(event);

      logger.info('Indeed webhook processed', { eventType: event.type });
    } catch (error: any) {
      logger.error('Failed to process Indeed webhook', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify webhook challenge (for initial webhook setup)
   */
  static async verifyWebhookChallenge(
    partner: 'LINKEDIN' | 'INDEED',
    challenge: string
  ): Promise<string> {
    // Return challenge for webhook verification
    return challenge;
  }
}

