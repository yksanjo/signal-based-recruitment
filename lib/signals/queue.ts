import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { SignalIngestion } from './ingestion';
import { prisma } from '@/lib/db';

/**
 * Production-grade queue system for background signal processing
 * Uses BullMQ with Redis for reliable job processing
 */
export class SignalQueue {
  private redis: Redis;
  private queue: Queue;
  private worker: Worker;
  private queueEvents: QueueEvents;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    this.queue = new Queue('signal-collection', {
      connection: this.redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep last 1000 jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      },
    });

    this.worker = new Worker(
      'signal-collection',
      async (job) => {
        return await this.processSignalJob(job.data);
      },
      {
        connection: this.redis,
        concurrency: 5, // Process 5 jobs concurrently
        limiter: {
          max: 10, // Max 10 jobs
          duration: 1000, // Per second
        },
      }
    );

    this.queueEvents = new QueueEvents('signal-collection', {
      connection: this.redis,
    });

    this.setupEventHandlers();
  }

  async addSignalCollectionJob(data: {
    keywords?: string[];
    location?: string;
    daysBack?: number;
    source?: string;
  }): Promise<string> {
    const job = await this.queue.add('collect-signals', data, {
      priority: data.source === 'webhook' ? 1 : 2, // Webhooks get higher priority
    });

    return job.id!;
  }

  async addBulkSignalCollectionJob(jobs: Array<{
    keywords?: string[];
    location?: string;
    daysBack?: number;
  }>): Promise<string[]> {
    const jobIds: string[] = [];

    for (const jobData of jobs) {
      const job = await this.queue.add('collect-signals', jobData);
      jobIds.push(job.id!);
    }

    return jobIds;
  }

  private async processSignalJob(data: any): Promise<{ count: number }> {
    const ingestion = new SignalIngestion();
    const signals = await ingestion.ingestJobPostings({
      keywords: data.keywords,
      location: data.location,
      daysBack: data.daysBack,
    });

    return { count: signals.length };
  }

  private setupEventHandlers(): void {
    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`Job ${jobId} completed. Collected ${returnvalue?.count || 0} signals.`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`Job ${jobId} failed:`, failedReason);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`Job ${jobId} progress:`, data);
    });
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  async close(): Promise<void> {
    await Promise.all([
      this.worker.close(),
      this.queueEvents.close(),
      this.queue.close(),
    ]);
    // Don't quit redis as it might be used elsewhere
    // await this.redis.quit();
  }
}

