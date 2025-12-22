import { LinkedInScraper } from './scrapers/linkedin';
import { IndeedScraper } from './scrapers/indeed';
import { GlassdoorScraper } from './scrapers/glassdoor';
import { JobPosting, Signal } from '@/lib/types';
import { prisma } from '@/lib/db';

export class SignalIngestion {
  private scrapers = [
    new LinkedInScraper(),
    new IndeedScraper(),
    new GlassdoorScraper(),
  ];

  async ingestJobPostings(filters: {
    keywords?: string[];
    location?: string;
    daysBack?: number;
  }): Promise<Signal[]> {
    const allJobs: JobPosting[] = [];

    // Scrape from all sources in parallel
    const scrapingPromises = this.scrapers.map(scraper =>
      scraper.scrapeJobs(filters).catch(error => {
        console.error(`Error scraping ${scraper.name}:`, error);
        return [];
      })
    );

    const results = await Promise.all(scrapingPromises);
    results.forEach(jobs => allJobs.push(...jobs));

    // Convert job postings to signals and store
    const signals: Signal[] = [];
    
    for (const job of allJobs) {
      // Check if signal already exists
      const existing = await prisma.signal.findFirst({
        where: {
          type: 'JOB_POSTING',
          companyName: job.company,
          jobUrl: job.url,
        },
      });

      if (existing) continue;

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
        companyUrl: signal.companyUrl || undefined,
        jobUrl: signal.jobUrl || undefined,
        location: signal.location || undefined,
        postedDate: signal.postedDate || undefined,
        processed: signal.processed,
      });
    }

    return signals;
  }

  async ingestFundingSignals(companies: Array<{
    name: string;
    amount: number;
    round: string;
    date: Date;
  }>): Promise<Signal[]> {
    const signals: Signal[] = [];

    for (const funding of companies) {
      const signal = await prisma.signal.create({
        data: {
          type: 'FUNDING_ANNOUNCEMENT',
          source: 'funding_api',
          companyName: funding.name,
          postedDate: funding.date,
          rawData: funding as any,
        },
      });

      signals.push({
        id: signal.id,
        type: signal.type as any,
        source: signal.source,
        companyName: signal.companyName,
        postedDate: signal.postedDate || undefined,
        processed: signal.processed,
      });
    }

    return signals;
  }
}

