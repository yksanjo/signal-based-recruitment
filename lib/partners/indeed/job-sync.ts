import { IndeedAPIClient } from './api-client';
import { JobPostingData } from '../base-partner';
import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';

/**
 * Indeed Job Sync Manager
 * Handles job synchronization operations with Indeed
 */
export class IndeedJobSync {
  private client: IndeedAPIClient;

  constructor(client: IndeedAPIClient) {
    this.client = client;
  }

  /**
   * Post a job from a signal to Indeed
   */
  async postJobFromSignal(signalId: string): Promise<{ partnerJobId: string; url: string }> {
    const signal = await prisma.signal.findUnique({
      where: { id: signalId },
      include: { enrichments: true },
    });

    if (!signal) {
      throw new Error(`Signal not found: ${signalId}`);
    }

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
      where: { partner: 'INDEED', status: 'ACTIVE' },
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
   * Sync all active jobs to Indeed
   */
  async syncActiveJobs(): Promise<void> {
    const signals = await prisma.signal.findMany({
      where: {
        type: 'JOB_POSTING',
        processed: false,
      },
      take: 50,
    });

    logger.info('Syncing jobs to Indeed', { count: signals.length });

    for (const signal of signals) {
      try {
        await this.postJobFromSignal(signal.id);
        await prisma.signal.update({
          where: { id: signal.id },
          data: { processed: true },
        });
      } catch (error: any) {
        logger.error('Failed to sync job to Indeed', {
          signalId: signal.id,
          error: error.message,
        });
      }
    }
  }

  /**
   * Sync job statuses from Indeed
   */
  async syncJobStatuses(): Promise<void> {
    const integration = await prisma.partnerIntegration.findFirst({
      where: { partner: 'INDEED', status: 'ACTIVE' },
    });

    if (!integration) return;

    const partnerJobs = await prisma.partnerJobPosting.findMany({
      where: {
        integrationId: integration.id,
        status: { in: ['POSTED', 'PAUSED'] },
      },
    });

    logger.info('Syncing job statuses from Indeed', { count: partnerJobs.length });

    // This would fetch current status from Indeed API
    // For now, it's a placeholder
    for (const job of partnerJobs) {
      try {
        // Would call Indeed API to get current status
        // await this.client.getJobStatus(job.partnerJobId);
      } catch (error: any) {
        logger.error('Failed to sync job status', {
          jobId: job.id,
          error: error.message,
        });
      }
    }
  }
}

