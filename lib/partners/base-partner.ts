import { JobPosting } from '@/lib/types';
import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';

export interface PartnerConfig {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookUrl?: string;
  [key: string]: any;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  errors?: string[];
}

export interface JobPostingData {
  title: string;
  company: string;
  location?: string;
  description?: string;
  url?: string;
  postedDate?: Date;
  metadata?: Record<string, any>;
}

/**
 * Base class for partner integrations (LinkedIn, Indeed, etc.)
 * Provides common functionality for authentication, job posting sync, and webhook handling
 */
export abstract class BasePartner {
  abstract readonly partnerType: 'LINKEDIN' | 'INDEED' | 'GLASSDOOR';
  abstract readonly name: string;

  protected config: PartnerConfig;
  protected integrationId?: string;

  constructor(config: PartnerConfig, integrationId?: string) {
    this.config = config;
    this.integrationId = integrationId;
  }

  /**
   * Initialize the partner integration
   * Should handle authentication, token refresh, etc.
   */
  abstract initialize(): Promise<void>;

  /**
   * Search for job postings from the partner platform
   */
  abstract searchJobs(filters: {
    keywords?: string[];
    location?: string;
    daysBack?: number;
  }): Promise<JobPosting[]>;

  /**
   * Post a job to the partner platform
   */
  abstract postJob(jobData: JobPostingData): Promise<{ partnerJobId: string; url: string }>;

  /**
   * Update an existing job posting on the partner platform
   */
  abstract updateJob(partnerJobId: string, jobData: Partial<JobPostingData>): Promise<void>;

  /**
   * Delete/close a job posting on the partner platform
   */
  abstract deleteJob(partnerJobId: string): Promise<void>;

  /**
   * Sync job postings bidirectionally
   */
  abstract syncJobs(options?: {
    direction?: 'pull' | 'push' | 'bidirectional';
    limit?: number;
  }): Promise<SyncResult>;

  /**
   * Verify webhook signature
   */
  abstract verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean;

  /**
   * Process incoming webhook event
   */
  abstract processWebhook(event: any): Promise<void>;

  /**
   * Refresh authentication token (for OAuth-based partners)
   */
  protected async refreshToken(): Promise<string | null> {
    // Override in subclasses that use OAuth
    return null;
  }

  /**
   * Make authenticated API request with retry logic
   */
  protected async makeRequest(
    url: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<Response> {
    const headers = {
      ...options.headers,
      ...this.getAuthHeaders(),
    };

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        // Handle token refresh for 401 errors
        if (response.status === 401 && attempt < retries - 1) {
          const newToken = await this.refreshToken();
          if (newToken) {
            this.config.accessToken = newToken;
            continue;
          }
        }

        if (!response.ok && response.status !== 401) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return response;
      } catch (error) {
        if (attempt === retries - 1) throw error;
        await this.delay(1000 * (attempt + 1));
      }
    }

    throw new Error('Request failed after retries');
  }

  /**
   * Get authentication headers for API requests
   */
  protected getAuthHeaders(): Record<string, string> {
    // Override in subclasses
    return {};
  }

  /**
   * Log sync operation to database
   */
  protected async logSync(
    syncType: string,
    status: 'success' | 'error' | 'partial',
    recordsProcessed: number,
    recordsFailed: number,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.integrationId) return;

    try {
      await prisma.partnerSyncLog.create({
        data: {
          integrationId: this.integrationId,
          syncType,
          status,
          recordsProcessed,
          recordsFailed,
          errorMessage,
          metadata,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to log sync', { error, integrationId: this.integrationId });
    }
  }

  /**
   * Update integration status in database
   */
  protected async updateIntegrationStatus(
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'ERROR',
    lastSyncAt?: Date
  ): Promise<void> {
    if (!this.integrationId) return;

    try {
      await prisma.partnerIntegration.update({
        where: { id: this.integrationId },
        data: {
          status,
          lastSyncAt: lastSyncAt || new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to update integration status', {
        error,
        integrationId: this.integrationId,
      });
    }
  }

  /**
   * Create or update partner job posting in database
   */
  protected async upsertPartnerJobPosting(
    partnerJobId: string,
    signalId: string | null,
    status: 'DRAFT' | 'POSTED' | 'PAUSED' | 'CLOSED' | 'EXPIRED' | 'DELETED',
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.integrationId) return;

    try {
      await prisma.partnerJobPosting.upsert({
        where: {
          integrationId_partnerJobId: {
            integrationId: this.integrationId,
            partnerJobId,
          },
        },
        create: {
          integrationId: this.integrationId,
          partnerJobId,
          signalId,
          status,
          metadata,
          postedAt: status === 'POSTED' ? new Date() : undefined,
        },
        update: {
          status,
          metadata,
          postedAt: status === 'POSTED' ? new Date() : undefined,
        },
      });
    } catch (error) {
      logger.error('Failed to upsert partner job posting', {
        error,
        partnerJobId,
        integrationId: this.integrationId,
      });
    }
  }

  /**
   * Utility: Delay execution
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Utility: Parse date from various formats
   */
  protected parseDate(dateString: string): Date | undefined {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  }
}

