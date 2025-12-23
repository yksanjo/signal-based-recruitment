import { JobPosting } from '@/lib/types';

export abstract class BaseScraper {
  abstract name: string;
  
  abstract scrapeJobs(filters: {
    keywords?: string[];
    location?: string;
    daysBack?: number;
  }): Promise<JobPosting[]>;
  
  protected async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        if (response.ok) return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error(`Failed to fetch ${url} after ${retries} retries`);
  }
}




