import Parser from 'rss-parser';
import { JobPosting } from '@/lib/types';

/**
 * RSS Feed collector for job boards that provide RSS feeds
 * Many job boards (Indeed, Stack Overflow, etc.) provide RSS feeds
 */
export class RSSFeedCollector {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: ['description', 'pubDate', 'location', 'company'],
      },
    });
  }

  async collectFromFeed(feedUrl: string, source: 'linkedin' | 'indeed' | 'glassdoor'): Promise<JobPosting[]> {
    const jobs: JobPosting[] = [];

    try {
      const feed = await this.parser.parseURL(feedUrl);

      for (const item of feed.items) {
        if (!item.title || !item.link) continue;

        jobs.push({
          title: item.title,
          company: this.extractCompany(item) || 'Unknown',
          location: this.extractLocation(item) || '',
          url: item.link,
          postedDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          source,
          description: item.contentSnippet || item.content || '',
        });
      }

      return jobs;
    } catch (error: any) {
      console.error(`RSS feed collection error for ${feedUrl}:`, error.message);
      return [];
    }
  }

  async collectFromMultipleFeeds(feedUrls: string[], source: 'linkedin' | 'indeed' | 'glassdoor'): Promise<JobPosting[]> {
    const allJobs: JobPosting[] = [];

    for (const feedUrl of feedUrls) {
      try {
        const jobs = await this.collectFromFeed(feedUrl, source);
        allJobs.push(...jobs);
      } catch (error) {
        console.error(`Failed to collect from ${feedUrl}:`, error);
      }
    }

    return allJobs;
  }

  private extractCompany(item: any): string | null {
    // Try various fields where company might be stored
    return item.company || item['dc:creator'] || null;
  }

  private extractLocation(item: any): string | null {
    return item.location || item['geo:lat'] || null;
  }
}

