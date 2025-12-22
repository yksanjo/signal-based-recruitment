import axios from 'axios';
import { JobPosting } from '@/lib/types';

/**
 * Production-grade LinkedIn Jobs collector using SerpAPI
 * SerpAPI provides reliable, scalable job posting data
 * Sign up at: https://serpapi.com/
 */
export class SerpAPICollector {
  private apiKey: string;
  private baseUrl = 'https://serpapi.com/search.json';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SERPAPI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('SerpAPI key not configured. Using fallback collector.');
    }
  }

  async collectLinkedInJobs(filters: {
    keywords?: string[];
    location?: string;
    daysBack?: number;
  }): Promise<JobPosting[]> {
    if (!this.apiKey) {
      return [];
    }

    const jobs: JobPosting[] = [];
    const keywords = filters.keywords?.join(' ') || '';
    const location = filters.location || '';

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          engine: 'linkedin_jobs',
          api_key: this.apiKey,
          keywords,
          location,
          page: 1,
        },
        timeout: 30000,
      });

      const jobResults = response.data?.jobs_results || [];
      
      for (const job of jobResults) {
        jobs.push({
          title: job.title || '',
          company: job.company_name || '',
          location: job.location || location,
          url: job.link || '',
          postedDate: job.detected_extensions?.posted_at 
            ? this.parseDate(job.detected_extensions.posted_at)
            : new Date(),
          source: 'linkedin',
          description: job.description,
        });
      }

      return jobs;
    } catch (error: any) {
      console.error('SerpAPI LinkedIn collection error:', error.message);
      throw new Error(`SerpAPI collection failed: ${error.message}`);
    }
  }

  async collectIndeedJobs(filters: {
    keywords?: string[];
    location?: string;
    daysBack?: number;
  }): Promise<JobPosting[]> {
    if (!this.apiKey) {
      return [];
    }

    const jobs: JobPosting[] = [];
    const keywords = filters.keywords?.join(' ') || '';
    const location = filters.location || '';

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          engine: 'indeed',
          api_key: this.apiKey,
          q: keywords,
          l: location,
        },
        timeout: 30000,
      });

      const jobResults = response.data?.organic_results || [];
      
      for (const job of jobResults) {
        jobs.push({
          title: job.title || '',
          company: job.company_name || '',
          location: job.location || location,
          url: job.link || '',
          postedDate: new Date(), // Indeed doesn't always provide dates
          source: 'indeed',
          description: job.snippet,
        });
      }

      return jobs;
    } catch (error: any) {
      console.error('SerpAPI Indeed collection error:', error.message);
      throw new Error(`SerpAPI Indeed collection failed: ${error.message}`);
    }
  }

  private parseDate(dateString: string): Date {
    // Parse various date formats from SerpAPI
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  }
}

