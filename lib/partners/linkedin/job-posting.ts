import { LinkedInAPIClient } from './api-client';
import { JobPostingData } from '../base-partner';
import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';

/**
 * LinkedIn Job Posting Manager
 * Handles job posting operations with LinkedIn
 */
export class LinkedInJobPostingManager {
  private client: LinkedInAPIClient;

  constructor(client: LinkedInAPIClient) {
    this.client = client;
  }

  /**
   * Post a job from a signal to LinkedIn
   */
  async postJobFromSignal(signalId: string): Promise<{ partnerJobId: string; url: string }> {
    const signal = await prisma.signal.findUnique({
      where: { id: signalId },
      include: { enrichments: true },
    });

    if (!signal) {
      throw new Error(`Signal not found: ${signalId}`);
    }

    const enrichment = signal.enrichments[0];

    const jobData: JobPostingData = {
      title: signal.title || '',
      company: signal.companyName,
      location: signal.location || undefined,
      description: (signal.rawData as any)?.description || '',
      metadata: {
        signalId,
        companyUrl: signal.companyUrl,
      },
    };

    const result = await this.client.postJob(jobData);

    // Store partner job posting
    const integration = await prisma.partnerIntegration.findFirst({
      where: { partner: 'LINKEDIN', status: 'ACTIVE' },
    });

    if (integration) {
      await prisma.partnerJobPosting.create({
        data: {
          integrationId: integration.id,
          partnerJobId: result.partnerJobId,
          signalId,
          status: 'POSTED',
          postedAt: new Date(),
          metadata: { url: result.url },
        },
      });
    }

    return result;
  }

  /**
   * Sync all active jobs to LinkedIn
   */
  async syncActiveJobs(): Promise<void> {
    const signals = await prisma.signal.findMany({
      where: {
        type: 'JOB_POSTING',
        processed: false,
      },
      take: 50,
    });

    logger.info('Syncing jobs to LinkedIn', { count: signals.length });

    for (const signal of signals) {
      try {
        await this.postJobFromSignal(signal.id);
        await prisma.signal.update({
          where: { id: signal.id },
          data: { processed: true },
        });
      } catch (error: any) {
        logger.error('Failed to sync job to LinkedIn', {
          signalId: signal.id,
          error: error.message,
        });
      }
    }
  }
}

