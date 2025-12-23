import cron from 'node-cron';
import { ProductionSignalIngestion } from './ingestion-v2';
import logger from '@/lib/monitoring/logger';

/**
 * Scheduled signal collection jobs
 * Runs automatic collection at specified intervals
 */
export class SignalScheduler {
  private ingestion: ProductionSignalIngestion;
  private jobs: cron.ScheduledTask[] = [];

  constructor() {
    this.ingestion = new ProductionSignalIngestion();
  }

  /**
   * Start scheduled collection jobs
   */
  start(): void {
    // Collect signals every 6 hours
    const job1 = cron.schedule('0 */6 * * *', async () => {
      logger.info('Running scheduled signal collection');
      try {
        const { stats } = await this.ingestion.ingestJobPostings({
          keywords: ['Head of Engineering', 'VP of Sales', 'Director'],
          location: 'Brazil',
          daysBack: 7,
          useQueue: true, // Use background queue
        });
        logger.info('Scheduled collection completed', stats);
      } catch (error: any) {
        logger.error('Scheduled collection failed', { error: error.message });
      }
    });

    // Collect funding signals daily at 2 AM
    const job2 = cron.schedule('0 2 * * *', async () => {
      logger.info('Running scheduled funding signal collection');
      try {
        await this.ingestion.ingestFundingSignals({
          minAmount: 1000000,
          daysBack: 7,
        });
        logger.info('Scheduled funding collection completed');
      } catch (error: any) {
        logger.error('Scheduled funding collection failed', { error: error.message });
      }
    });

    this.jobs.push(job1, job2);
    logger.info('Signal scheduler started');
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    this.jobs.forEach(job => job.stop());
    logger.info('Signal scheduler stopped');
  }
}




