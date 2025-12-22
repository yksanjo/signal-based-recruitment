import { SignalIngestion } from './ingestion';
import { SerpAPICollector } from './collectors/serpapi';
import { ScraperAPICollector } from './collectors/scraperapi';
import { RSSFeedCollector } from './collectors/rss';
import { FundingSignalCollector } from './collectors/funding';
import { RateLimiter } from './rate-limiter';
import { SignalQueue } from './queue';
import { JobPosting, Signal } from '@/lib/types';
import { prisma } from '@/lib/db';
import pLimit from 'p-limit';

/**
 * Production-grade signal ingestion with:
 * - Multiple collector sources
 * - Rate limiting
 * - Error handling and retries
 * - Deduplication
 * - Queue integration
 * - Monitoring
 */
export class ProductionSignalIngestion {
  private serpAPI: SerpAPICollector;
  private scraperAPI: ScraperAPICollector;
  private rssCollector: RSSFeedCollector;
  private fundingCollector: FundingSignalCollector;
  private rateLimiter: RateLimiter;
  private queue: SignalQueue;
  private limit: ReturnType<typeof pLimit>;

  constructor() {
    this.serpAPI = new SerpAPICollector();
    this.scraperAPI = new ScraperAPICollector();
    this.rssCollector = new RSSFeedCollector();
    this.fundingCollector = new FundingSignalCollector();
    this.rateLimiter = new RateLimiter();
    this.queue = new SignalQueue();
    this.limit = pLimit(5); // Process 5 collectors concurrently
  }

  /**
   * Main ingestion method with production features
   */
  async ingestJobPostings(filters: {
    keywords?: string[];
    location?: string;
    daysBack?: number;
    useQueue?: boolean; // Use background queue
    sources?: string[]; // Specific sources to use
  }): Promise<{ signals: Signal[]; stats: IngestionStats }> {
    const stats: IngestionStats = {
      totalCollected: 0,
      duplicates: 0,
      errors: 0,
      sources: {},
    };

    // If queue is requested, add to background processing
    if (filters.useQueue) {
      const jobId = await this.queue.addSignalCollectionJob(filters);
      return {
        signals: [],
        stats: { ...stats, queueJobId: jobId },
      };
    }

    const allJobs: JobPosting[] = [];
    const sources = filters.sources || ['serpapi', 'scraperapi', 'rss'];

    // Collect from multiple sources in parallel with rate limiting
    const collectionPromises = sources.map(source =>
      this.limit(async () => {
        try {
          // Check rate limit before collecting
          const rateLimitKey = `${source}:${filters.location || 'global'}`;
          await this.rateLimiter.waitForLimit(rateLimitKey, 50, 60); // 50 per minute

          let jobs: JobPosting[] = [];

          switch (source) {
            case 'serpapi':
              jobs = await this.serpAPI.collectLinkedInJobs(filters);
              break;
            case 'scraperapi':
              jobs = await this.scraperAPI.collectLinkedInJobs(filters);
              break;
            case 'rss':
              // Collect from RSS feeds
              const rssFeeds = this.getRSSFeeds(filters.location);
              jobs = await this.rssCollector.collectFromMultipleFeeds(
                rssFeeds,
                'linkedin'
              );
              break;
          }

          stats.sources[source] = jobs.length;
          stats.totalCollected += jobs.length;
          allJobs.push(...jobs);
        } catch (error: any) {
          console.error(`Error collecting from ${source}:`, error);
          stats.errors++;
          stats.sources[source] = 0;
        }
      })
    );

    await Promise.allSettled(collectionPromises);

    // Deduplicate and store signals
    const { signals, duplicates } = await this.deduplicateAndStore(allJobs);
    stats.duplicates = duplicates;

    return { signals, stats };
  }

  /**
   * Collect funding signals
   */
  async ingestFundingSignals(filters: {
    minAmount?: number;
    rounds?: string[];
    daysBack?: number;
  }): Promise<Signal[]> {
    const signals = await this.fundingCollector.collectFromCrunchbase(filters);
    
    // Store signals
    const storedSignals: Signal[] = [];
    for (const signal of signals) {
      const existing = await prisma.signal.findFirst({
        where: {
          type: 'FUNDING_ANNOUNCEMENT',
          companyName: signal.companyName,
          postedDate: signal.postedDate,
        },
      });

      if (existing) continue;

      const created = await prisma.signal.create({
        data: {
          type: 'FUNDING_ANNOUNCEMENT',
          source: signal.source,
          companyName: signal.companyName,
          postedDate: signal.postedDate,
          rawData: signal.rawData,
        },
      });

      storedSignals.push({
        id: created.id,
        type: created.type as any,
        source: created.source,
        companyName: created.companyName,
        postedDate: created.postedDate || undefined,
        processed: created.processed,
      });
    }

    return storedSignals;
  }

  /**
   * Deduplicate jobs and store as signals
   */
  private async deduplicateAndStore(
    jobs: JobPosting[]
  ): Promise<{ signals: Signal[]; duplicates: number }> {
    const signals: Signal[] = [];
    let duplicates = 0;

    // Group by company + title to find duplicates
    const seen = new Set<string>();

    for (const job of jobs) {
      const key = `${job.company}:${job.title}:${job.url}`;
      
      if (seen.has(key)) {
        duplicates++;
        continue;
      }

      seen.add(key);

      // Check database for existing signal
      const existing = await prisma.signal.findFirst({
        where: {
          type: 'JOB_POSTING',
          companyName: job.company,
          jobUrl: job.url,
        },
      });

      if (existing) {
        duplicates++;
        continue;
      }

      // Create new signal
      const signal = await prisma.signal.create({
        data: {
          type: 'JOB_POSTING',
          source: job.source,
          title: job.title,
          companyName: job.company,
          jobUrl: job.url,
          location: job.location,
          postedDate: job.postedDate,
          rawData: job as any,
        },
      });

      signals.push({
        id: signal.id,
        type: signal.type as any,
        source: signal.source,
        title: signal.title || undefined,
        companyName: signal.companyName,
        jobUrl: signal.jobUrl || undefined,
        location: signal.location || undefined,
        postedDate: signal.postedDate || undefined,
        processed: signal.processed,
      });
    }

    return { signals, duplicates };
  }

  /**
   * Get RSS feed URLs based on location
   */
  private getRSSFeeds(location?: string): string[] {
    const feeds: string[] = [];

    // Indeed RSS feeds
    if (location) {
      feeds.push(
        `https://www.indeed.com/rss?q=VP&l=${encodeURIComponent(location)}`,
        `https://www.indeed.com/rss?q=Head+of+Engineering&l=${encodeURIComponent(location)}`,
        `https://www.indeed.com/rss?q=Director&l=${encodeURIComponent(location)}`
      );
    }

    return feeds;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return await this.queue.getQueueStats();
  }
}

interface IngestionStats {
  totalCollected: number;
  duplicates: number;
  errors: number;
  sources: Record<string, number>;
  queueJobId?: string;
}

