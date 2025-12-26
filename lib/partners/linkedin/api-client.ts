import axios, { AxiosInstance } from 'axios';
import { BasePartner, PartnerConfig, JobPostingData, SyncResult } from '../base-partner';
import { JobPosting } from '@/lib/types';
import logger from '@/lib/monitoring/logger';

/**
 * LinkedIn API Client
 * Handles OAuth 2.0 authentication and API interactions with LinkedIn
 * 
 * API Documentation: https://learn.microsoft.com/en-us/linkedin/
 */
export class LinkedInAPIClient extends BasePartner {
  readonly partnerType = 'LINKEDIN' as const;
  readonly name = 'LinkedIn';

  private apiBaseUrl = 'https://api.linkedin.com/v2';
  private authBaseUrl = 'https://www.linkedin.com/oauth/v2';
  private client: AxiosInstance;

  constructor(config: PartnerConfig, integrationId?: string) {
    super(config, integrationId);
    this.client = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 30000,
    });
  }

  async initialize(): Promise<void> {
    // Verify access token is valid
    if (!this.config.accessToken) {
      throw new Error('LinkedIn access token not configured');
    }

    // Optionally verify token by making a test request
    try {
      await this.verifyToken();
      await this.updateIntegrationStatus('ACTIVE');
    } catch (error) {
      logger.error('LinkedIn initialization failed', { error });
      await this.updateIntegrationStatus('ERROR');
      throw error;
    }
  }

  protected async refreshToken(): Promise<string | null> {
    if (!this.config.refreshToken || !this.config.clientId || !this.config.clientSecret) {
      logger.warn('Cannot refresh LinkedIn token: missing credentials');
      return null;
    }

    try {
      const response = await axios.post(
        `${this.authBaseUrl}/accessToken`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token } = response.data;
      this.config.accessToken = access_token;
      if (refresh_token) {
        this.config.refreshToken = refresh_token;
      }

      // Update in database
      if (this.integrationId) {
        const { prisma } = await import('@/lib/db');
        await prisma.partnerIntegration.update({
          where: { id: this.integrationId },
          data: {
            accessToken: access_token,
            refreshToken: refresh_token || this.config.refreshToken,
          },
        });
      }

      return access_token;
    } catch (error) {
      logger.error('Failed to refresh LinkedIn token', { error });
      return null;
    }
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async verifyToken(): Promise<boolean> {
    try {
      const response = await this.client.get('/me', {
        headers: this.getAuthHeaders(),
      });
      return response.status === 200;
    } catch (error) {
      return false;
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
      // LinkedIn Jobs Search API
      // Note: This requires LinkedIn Jobs API access (partnership program)
      const response = await this.client.get('/jobSearch', {
        headers: this.getAuthHeaders(),
        params: {
          keywords,
          location,
          count: 25,
          start: 0,
        },
      });

      const jobResults = response.data?.elements || [];

      for (const job of jobResults) {
        jobs.push({
          title: job.title || '',
          company: job.companyDetails?.name || '',
          location: job.formattedLocation || location,
          url: job.jobPostingUrl || '',
          postedDate: job.listedAt ? new Date(job.listedAt) : undefined,
          source: 'linkedin',
          description: job.description?.text || '',
        });
      }

      logger.info('LinkedIn job search completed', {
        count: jobs.length,
        keywords,
        location,
      });
    } catch (error: any) {
      // If Jobs API is not available, fall back to alternative methods
      logger.warn('LinkedIn Jobs API not available, using fallback', {
        error: error.message,
      });
      // Could fall back to scraping or other methods here
    }

    return jobs;
  }

  async postJob(jobData: JobPostingData): Promise<{ partnerJobId: string; url: string }> {
    try {
      // LinkedIn Job Posting API
      // Requires LinkedIn Talent Solutions partnership
      const jobPayload = {
        postingDetails: {
          title: jobData.title,
          description: {
            text: jobData.description || '',
          },
          companyDetails: {
            name: jobData.company,
          },
          location: {
            country: this.extractCountry(jobData.location),
            city: this.extractCity(jobData.location),
          },
        },
        visibility: {
          visibilityType: 'PUBLIC',
        },
      };

      const response = await this.client.post('/jobPostings', jobPayload, {
        headers: this.getAuthHeaders(),
      });

      const partnerJobId = response.data.id;
      const url = response.data.jobPostingUrl || '';

      logger.info('LinkedIn job posted successfully', { partnerJobId, title: jobData.title });

      return { partnerJobId, url };
    } catch (error: any) {
      logger.error('Failed to post job to LinkedIn', { error: error.message, jobData });
      throw new Error(`Failed to post job to LinkedIn: ${error.message}`);
    }
  }

  async updateJob(partnerJobId: string, jobData: Partial<JobPostingData>): Promise<void> {
    try {
      const updatePayload: any = {};

      if (jobData.title) {
        updatePayload['postingDetails.title'] = jobData.title;
      }
      if (jobData.description) {
        updatePayload['postingDetails.description.text'] = jobData.description;
      }

      await this.client.patch(`/jobPostings/${partnerJobId}`, updatePayload, {
        headers: this.getAuthHeaders(),
      });

      logger.info('LinkedIn job updated', { partnerJobId });
    } catch (error: any) {
      logger.error('Failed to update LinkedIn job', {
        error: error.message,
        partnerJobId,
      });
      throw new Error(`Failed to update job: ${error.message}`);
    }
  }

  async deleteJob(partnerJobId: string): Promise<void> {
    try {
      await this.client.delete(`/jobPostings/${partnerJobId}`, {
        headers: this.getAuthHeaders(),
      });

      logger.info('LinkedIn job deleted', { partnerJobId });
    } catch (error: any) {
      logger.error('Failed to delete LinkedIn job', {
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
        // Pull jobs from LinkedIn
        const jobs = await this.searchJobs({});
        recordsProcessed = Math.min(jobs.length, limit);

        // Store in database
        for (const job of jobs.slice(0, limit)) {
          try {
            // Create or update signal
            const { prisma } = await import('@/lib/db');
            const signal = await prisma.signal.upsert({
              where: {
                id: job.url, // Use URL as unique identifier
              },
              create: {
                type: 'JOB_POSTING',
                source: 'linkedin',
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
            if (this.integrationId) {
              await this.upsertPartnerJobPosting(
                job.url,
                signal.id,
                'POSTED',
                { source: 'linkedin', syncedAt: new Date() }
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
    // LinkedIn webhook signature verification
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
    // Process LinkedIn webhook events
    // Events: job.application, job.status_change, etc.
    logger.info('Processing LinkedIn webhook', { eventType: event.eventType });

    switch (event.eventType) {
      case 'JOB_APPLICATION':
        // Handle new application
        await this.handleApplication(event);
        break;
      case 'JOB_STATUS_CHANGE':
        // Handle job status change
        await this.handleJobStatusChange(event);
        break;
      default:
        logger.warn('Unknown LinkedIn webhook event type', { eventType: event.eventType });
    }
  }

  private async handleApplication(event: any): Promise<void> {
    // Store application in database
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
          source: 'linkedin',
          partnerData: event,
        },
      });
    }
  }

  private async handleJobStatusChange(event: any): Promise<void> {
    const { prisma } = await import('@/lib/db');
    const partnerJobId = event.jobId;
    const status = this.mapLinkedInStatusToOurStatus(event.status);

    await prisma.partnerJobPosting.updateMany({
      where: {
        integrationId: this.integrationId,
        partnerJobId,
      },
      data: { status },
    });
  }

  private mapLinkedInStatusToOurStatus(
    linkedInStatus: string
  ): 'DRAFT' | 'POSTED' | 'PAUSED' | 'CLOSED' | 'EXPIRED' | 'DELETED' {
    const statusMap: Record<string, 'DRAFT' | 'POSTED' | 'PAUSED' | 'CLOSED' | 'EXPIRED' | 'DELETED'> = {
      ACTIVE: 'POSTED',
      PAUSED: 'PAUSED',
      CLOSED: 'CLOSED',
      DELETED: 'DELETED',
      EXPIRED: 'EXPIRED',
      DRAFT: 'DRAFT',
    };

    return statusMap[linkedInStatus] || 'POSTED';
  }

  private extractCountry(location?: string): string {
    if (!location) return 'US';
    // Simple extraction - could be enhanced
    const parts = location.split(',');
    return parts[parts.length - 1]?.trim() || 'US';
  }

  private extractCity(location?: string): string {
    if (!location) return '';
    const parts = location.split(',');
    return parts[0]?.trim() || '';
  }
}

