import { prisma } from '@/lib/db';
import { LinkedInAPIClient } from './linkedin/api-client';
import { IndeedAPIClient } from './indeed/api-client';
import { LinkedInJobPostingManager } from './linkedin/job-posting';
import { IndeedJobSync } from './indeed/job-sync';
import logger from '@/lib/monitoring/logger';

/**
 * Partner Sync Service
 * Handles bidirectional job posting synchronization with conflict resolution
 */
export class PartnerSyncService {
  /**
   * Sync jobs from partner platforms (pull)
   */
  async syncFromPartners(options?: {
    partner?: 'LINKEDIN' | 'INDEED';
    limit?: number;
  }): Promise<{ success: boolean; results: any[] }> {
    const results: any[] = [];

    try {
      const integrations = await prisma.partnerIntegration.findMany({
        where: {
          status: 'ACTIVE',
          ...(options?.partner && { partner: options.partner }),
        },
      });

      for (const integration of integrations) {
        try {
          let syncResult;

          if (integration.partner === 'LINKEDIN') {
            const client = new LinkedInAPIClient(
              {
                accessToken: integration.accessToken as string,
                refreshToken: integration.refreshToken as string | undefined,
                clientId: process.env.LINKEDIN_CLIENT_ID,
                clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
              },
              integration.id
            );
            syncResult = await client.syncJobs({
              direction: 'pull',
              limit: options?.limit,
            });
          } else if (integration.partner === 'INDEED') {
            const client = new IndeedAPIClient(
              {
                apiKey: integration.apiKey as string,
                partnerId: process.env.INDEED_PARTNER_ID,
              },
              integration.id
            );
            syncResult = await client.syncJobs({
              direction: 'pull',
              limit: options?.limit,
            });
          }

          results.push({
            partner: integration.partner,
            success: syncResult?.success || false,
            recordsProcessed: syncResult?.recordsProcessed || 0,
            recordsFailed: syncResult?.recordsFailed || 0,
          });
        } catch (error: any) {
          logger.error('Failed to sync from partner', {
            partner: integration.partner,
            error: error.message,
          });
          results.push({
            partner: integration.partner,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        success: results.every((r) => r.success),
        results,
      };
    } catch (error: any) {
      logger.error('Partner sync failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Sync jobs to partner platforms (push)
   */
  async syncToPartners(options?: {
    partner?: 'LINKEDIN' | 'INDEED';
    signalIds?: string[];
    limit?: number;
  }): Promise<{ success: boolean; results: any[] }> {
    const results: any[] = [];

    try {
      const integrations = await prisma.partnerIntegration.findMany({
        where: {
          status: 'ACTIVE',
          ...(options?.partner && { partner: options.partner }),
        },
      });

      // Get signals to sync
      const where: any = {
        type: 'JOB_POSTING',
        processed: false,
      };
      if (options?.signalIds) {
        where.id = { in: options.signalIds };
      }

      const signals = await prisma.signal.findMany({
        where,
        take: options?.limit || 50,
      });

      for (const integration of integrations) {
        let posted = 0;
        let failed = 0;

        try {
          if (integration.partner === 'LINKEDIN') {
            const client = new LinkedInAPIClient(
              {
                accessToken: integration.accessToken as string,
                refreshToken: integration.refreshToken as string | undefined,
              },
              integration.id
            );
            const jobManager = new LinkedInJobPostingManager(client);

            for (const signal of signals) {
              try {
                await jobManager.postJobFromSignal(signal.id);
                await prisma.signal.update({
                  where: { id: signal.id },
                  data: { processed: true },
                });
                posted++;
              } catch (error: any) {
                logger.error('Failed to post job to LinkedIn', {
                  signalId: signal.id,
                  error: error.message,
                });
                failed++;
              }
            }
          } else if (integration.partner === 'INDEED') {
            const client = new IndeedAPIClient(
              {
                apiKey: integration.apiKey as string,
                partnerId: process.env.INDEED_PARTNER_ID,
              },
              integration.id
            );
            const jobSync = new IndeedJobSync(client);

            for (const signal of signals) {
              try {
                await jobSync.postJobFromSignal(signal.id);
                await prisma.signal.update({
                  where: { id: signal.id },
                  data: { processed: true },
                });
                posted++;
              } catch (error: any) {
                logger.error('Failed to post job to Indeed', {
                  signalId: signal.id,
                  error: error.message,
                });
                failed++;
              }
            }
          }

          results.push({
            partner: integration.partner,
            success: failed === 0,
            posted,
            failed,
          });
        } catch (error: any) {
          logger.error('Failed to sync to partner', {
            partner: integration.partner,
            error: error.message,
          });
          results.push({
            partner: integration.partner,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        success: results.every((r) => r.success),
        results,
      };
    } catch (error: any) {
      logger.error('Partner sync failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Bidirectional sync with conflict resolution
   */
  async bidirectionalSync(options?: {
    partner?: 'LINKEDIN' | 'INDEED';
    resolveConflicts?: 'ours' | 'theirs' | 'newest';
  }): Promise<{ success: boolean; results: any }> {
    const resolveConflicts = options?.resolveConflicts || 'newest';

    try {
      // Step 1: Pull from partners
      const pullResult = await this.syncFromPartners({
        partner: options?.partner,
      });

      // Step 2: Push to partners
      const pushResult = await this.syncToPartners({
        partner: options?.partner,
      });

      // Step 3: Resolve conflicts
      await this.resolveConflicts(resolveConflicts);

      return {
        success: pullResult.success && pushResult.success,
        results: {
          pull: pullResult,
          push: pushResult,
        },
      };
    } catch (error: any) {
      logger.error('Bidirectional sync failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Resolve conflicts between local and partner job postings
   */
  private async resolveConflicts(
    strategy: 'ours' | 'theirs' | 'newest'
  ): Promise<void> {
    // Find conflicting job postings
    const conflicts = await prisma.partnerJobPosting.findMany({
      where: {
        signal: {
          isNot: null,
        },
      },
      include: {
        signal: true,
        integration: true,
      },
    });

    for (const conflict of conflicts) {
      if (!conflict.signal) continue;

      let shouldUpdate = false;
      let updateData: any = {};

      if (strategy === 'newest') {
        // Use the most recently updated version
        const signalUpdated = conflict.signal.updatedAt;
        const jobUpdated = conflict.updatedAt;

        if (jobUpdated > signalUpdated) {
          // Partner version is newer, update signal
          shouldUpdate = true;
          updateData = {
            title: (conflict.metadata as any)?.title || conflict.signal.title,
            location: (conflict.metadata as any)?.location || conflict.signal.location,
          };
        }
      } else if (strategy === 'theirs') {
        // Always use partner version
        shouldUpdate = true;
        updateData = {
          title: (conflict.metadata as any)?.title || conflict.signal.title,
          location: (conflict.metadata as any)?.location || conflict.signal.location,
        };
      }
      // 'ours' strategy: keep local version, no update needed

      if (shouldUpdate) {
        await prisma.signal.update({
          where: { id: conflict.signal.id },
          data: updateData,
        });
      }
    }
  }

  /**
   * Sync application statuses from partners
   */
  async syncApplicationStatuses(): Promise<void> {
    const integrations = await prisma.partnerIntegration.findMany({
      where: {
        status: 'ACTIVE',
        partner: { in: ['LINKEDIN', 'INDEED'] },
      },
    });

    for (const integration of integrations) {
      // This would fetch application statuses from partner APIs
      // and update local applications accordingly
      logger.info('Syncing application statuses', { partner: integration.partner });
      // Implementation would go here
    }
  }
}

