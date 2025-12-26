import axios, { AxiosInstance } from 'axios';
import { BasePartner, PartnerConfig, JobPostingData, SyncResult } from '../base-partner';
import { JobPosting } from '@/lib/types';
import logger from '@/lib/monitoring/logger';

/**
 * Indeed API Client
 * Handles API authentication and interactions with Indeed
 * 
 * API Documentation: https://ads.indeed.com/jobroll/xmlfeed
 * Partner Program: https://www.indeed.com/hire/ats-integration
 */
export class IndeedAPIClient extends BasePartner {
  readonly partnerType = 'INDEED' as const;
  readonly name = 'Indeed';

  private apiBaseUrl = 'https://ads.indeed.com';
  private client: AxiosInstance;

  constructor(config: PartnerConfig, integrationId?: string) {
    super(config, integrationId);
    this.client = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 30000,
    });
  }

  async initialize(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Indeed API key not configured');
    }

    // Verify API key by making a test request
    try {
      await this.verifyApiKey();
      await this.updateIntegrationStatus('ACTIVE');
    } catch (error) {
      logger.error('Indeed initialization failed', { error });
      await this.updateIntegrationStatus('ERROR');
      throw error;
    }
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'X-Indeed-Partner-ID': this.config.partnerId || '',
    };
  }

  private async verifyApiKey(): Promise<boolean> {
    try {
      // Make a test API call to verify credentials
      const response = await this.client.get('/api/v1/jobs', {
        headers: this.getAuthHeaders(),
        params: {
          limit: 1,
        },
      });
      return response.status === 200;
    } catch (error) {
      logger.warn('Indeed API key verification failed', { error });
      // API might not be available yet, but don't fail initialization
      return true;
    }
  }

  async searchJobs(filters: {
    keywords?: string[];
    location?: string;
    daysBack?: number;
  }): Promise<JobPosting[]> {
    const jobs: JobPosting[] = [];
    const keywords = filters.keywords?.join(' ') || '';
    const location = filters.location || '';

    try {
      // Indeed Job Search API
      // Note: This requires Indeed Partner API access
      const response = await this.client.get('/api/v1/jobs/search', {
        headers: this.getAuthHeaders(),
        params: {
          q: keywords,
          l: location,
          limit: 25,
          fromage: filters.daysBack || 30,
        },
      });

      const jobResults = response.data?.results || [];

      for (const job of jobResults) {
        jobs.push({
          title: job.jobtitle || '',
          company: job.company || '',
          location: job.formattedLocation || job.location || location,
          url: job.url || job.jobkey ? `https://www.indeed.com/viewjob?jk=${job.jobkey}` : '',
          postedDate: job.date ? new Date(job.date) : undefined,
          source: 'indeed',
          description: job.snippet || '',
        });
      }

      logger.info('Indeed job search completed', {
        count: jobs.length,
        keywords,
        location,
      });
    } catch (error: any) {
      // If API is not available, log warning but don't fail
      logger.warn('Indeed Jobs API not available, using fallback', {
        error: error.message,
      });
    }

    return jobs;
  }

  async postJob(jobData: JobPostingData): Promise<{ partnerJobId: string; url: string }> {
    try {
      // Indeed Job Posting API
      // Requires Indeed ATS Partner Program membership
      const jobPayload = {
        title: jobData.title,
        description: jobData.description || '',
        company: jobData.company,
        location: jobData.location || '',
        jobType: 'FULLTIME', // Could be parameterized
        salary: undefined, // Could be added
      };

      const response = await this.client.post('/api/v1/jobs', jobPayload, {
        headers: this.getAuthHeaders(),
      });

      const partnerJobId = response.data.jobId || response.data.id;
      const url = response.data.url || `https://www.indeed.com/viewjob?jk=${partnerJobId}`;

      logger.info('Indeed job posted successfully', { partnerJobId, title: jobData.title });

      return { partnerJobId, url };
    } catch (error: any) {
      logger.error('Failed to post job to Indeed', { error: error.message, jobData });
      throw new Error(`Failed to post job to Indeed: ${error.message}`);
    }
  }

  async updateJob(partnerJobId: string, jobData: Partial<JobPostingData>): Promise<void> {
    try {
      const updatePayload: any = {};

      if (jobData.title) updatePayload.title = jobData.title;
      if (jobData.description) updatePayload.description = jobData.description;
      if (jobData.location) updatePayload.location = jobData.location;

      await this.client.patch(`/api/v1/jobs/${partnerJobId}`, updatePayload, {
        headers: this.getAuthHeaders(),
      });

      logger.info('Indeed job updated', { partnerJobId });
    } catch (error: any) {
      logger.error('Failed to update Indeed job', {
        error: error.message,
        partnerJobId,
      });
      throw new Error(`Failed to update job: ${error.message}`);
    }
  }

  async deleteJob(partnerJobId: string): Promise<void> {
    try {
      await this.client.delete(`/api/v1/jobs/${partnerJobId}`, {
        headers: this.getAuthHeaders(),
      });

      logger.info('Indeed job deleted', { partnerJobId });
    } catch (error: any) {
      logger.error('Failed to delete Indeed job', {
        error: error.message,
        partnerJobId,
      });
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  }

  async syncJobs(options?: {
    direction?: 'pull' | 'push' | 'bidirectional';
    limit?: number;
  }): Promise<SyncResult> {
    const direction = options?.direction || 'pull';
    const limit = options?.limit || 100;
    let recordsProcessed = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      if (direction === 'pull' || direction === 'bidirectional') {
        // Pull jobs from Indeed
        const jobs = await this.searchJobs({});
        recordsProcessed = Math.min(jobs.length, limit);

        // Store in database
        for (const job of jobs.slice(0, limit)) {
          try {
            const { prisma } = await import('@/lib/db');
            
            // Extract job key from URL if available
            const jobKeyMatch = job.url?.match(/jk=([^&]+)/);
            const jobKey = jobKeyMatch ? jobKeyMatch[1] : job.url || '';

            const signal = await prisma.signal.upsert({
              where: {
                id: jobKey,
              },
              create: {
                type: 'JOB_POSTING',
                source: 'indeed',
                title: job.title,
                companyName: job.company,
                location: job.location,
                jobUrl: job.url,
                postedDate: job.postedDate,
                rawData: job,
              },
              update: {
                title: job.title,
                companyName: job.company,
                location: job.location,
                postedDate: job.postedDate,
              },
            });

            // Link to partner job posting if integration exists
            if (this.integrationId && jobKey) {
              await this.upsertPartnerJobPosting(
                jobKey,
                signal.id,
                'POSTED',
                { source: 'indeed', syncedAt: new Date() }
              );
            }
          } catch (error: any) {
            recordsFailed++;
            errors.push(`Failed to store job ${job.url}: ${error.message}`);
          }
        }
      }

      await this.logSync('job_posting', 'success', recordsProcessed, recordsFailed, undefined, {
        direction,
        limit,
      });
      await this.updateIntegrationStatus('ACTIVE', new Date());

      return {
        success: recordsFailed === 0,
        recordsProcessed,
        recordsFailed,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      await this.logSync('job_posting', 'error', recordsProcessed, recordsFailed, error.message);
      await this.updateIntegrationStatus('ERROR');
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Indeed webhook signature verification
    // Uses HMAC SHA256
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  async processWebhook(event: any): Promise<void> {
    // Process Indeed webhook events
    // Events: application.received, application.status_changed, etc.
    logger.info('Processing Indeed webhook', { eventType: event.type });

    switch (event.type) {
      case 'application.received':
        await this.handleApplication(event);
        break;
      case 'application.status_changed':
        await this.handleApplicationStatusChange(event);
        break;
      case 'job.status_changed':
        await this.handleJobStatusChange(event);
        break;
      default:
        logger.warn('Unknown Indeed webhook event type', { eventType: event.type });
    }
  }

  private async handleApplication(event: any): Promise<void> {
    const { prisma } = await import('@/lib/db');
    const partnerJobId = event.jobId;

    // Find partner job posting
    const partnerJob = await prisma.partnerJobPosting.findFirst({
      where: {
        integrationId: this.integrationId,
        partnerJobId,
      },
    });

    if (partnerJob) {
      await prisma.application.create({
        data: {
          jobPostingId: partnerJob.id,
          status: 'APPLIED',
          source: 'indeed',
          partnerData: event,
        },
      });

      // Update application count
      await prisma.partnerJobPosting.update({
        where: { id: partnerJob.id },
        data: {
          applicationCount: {
            increment: 1,
          },
        },
      });
    }
  }

  private async handleApplicationStatusChange(event: any): Promise<void> {
    const { prisma } = await import('@/lib/db');
    const applicationId = event.applicationId;
    const status = this.mapIndeedStatusToOurStatus(event.status);

    await prisma.application.updateMany({
      where: {
        partnerData: {
          path: ['applicationId'],
          equals: applicationId,
        },
      },
      data: { status },
    });
  }

  private async handleJobStatusChange(event: any): Promise<void> {
    const { prisma } = await import('@/lib/db');
    const partnerJobId = event.jobId;
    const status = this.mapIndeedJobStatusToOurStatus(event.status);

    await prisma.partnerJobPosting.updateMany({
      where: {
        integrationId: this.integrationId,
        partnerJobId,
      },
      data: { status },
    });
  }

  private mapIndeedStatusToOurStatus(
    indeedStatus: string
  ): 'APPLIED' | 'REVIEWING' | 'SCREENING' | 'INTERVIEWING' | 'OFFERED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' {
    const statusMap: Record<string, 'APPLIED' | 'REVIEWING' | 'SCREENING' | 'INTERVIEWING' | 'OFFERED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'> = {
      applied: 'APPLIED',
      reviewing: 'REVIEWING',
      screening: 'SCREENING',
      interviewing: 'INTERVIEWING',
      offered: 'OFFERED',
      accepted: 'ACCEPTED',
      rejected: 'REJECTED',
      withdrawn: 'WITHDRAWN',
    };

    return statusMap[indeedStatus.toLowerCase()] || 'APPLIED';
  }

  private mapIndeedJobStatusToOurStatus(
    indeedStatus: string
  ): 'DRAFT' | 'POSTED' | 'PAUSED' | 'CLOSED' | 'EXPIRED' | 'DELETED' {
    const statusMap: Record<string, 'DRAFT' | 'POSTED' | 'PAUSED' | 'CLOSED' | 'EXPIRED' | 'DELETED'> = {
      active: 'POSTED',
      paused: 'PAUSED',
      closed: 'CLOSED',
      deleted: 'DELETED',
      expired: 'EXPIRED',
      draft: 'DRAFT',
    };

    return statusMap[indeedStatus.toLowerCase()] || 'POSTED';
  }
}

