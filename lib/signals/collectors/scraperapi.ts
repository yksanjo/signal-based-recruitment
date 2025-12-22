import axios from 'axios';
import * as cheerio from 'cheerio';
import { JobPosting } from '@/lib/types';

/**
 * Production-grade collector using ScraperAPI
 * Handles proxies, CAPTCHAs, and rate limiting automatically
 * Sign up at: https://www.scraperapi.com/
 */
export class ScraperAPICollector {
  private apiKey: string;
  private baseUrl = 'http://api.scraperapi.com';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SCRAPERAPI_KEY || '';
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
    
    const searchUrl = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`;

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          api_key: this.apiKey,
          url: searchUrl,
          render: 'true', // Render JavaScript
        },
        timeout: 60000,
      });

      const $ = cheerio.load(response.data);
      const jobCards = $('.jobs-search__results-list li');

      jobCards.each((_, element) => {
        const title = $(element).find('.base-search-card__title').text().trim();
        const company = $(element).find('.base-search-card__subtitle').text().trim();
        const location = $(element).find('.job-search-card__location').text().trim();
        const jobUrl = $(element).find('a.base-card__full-link').attr('href') || '';

        if (title && company) {
          jobs.push({
            title,
            company,
            location,
            url: jobUrl,
            postedDate: this.extractDate($(element)),
            source: 'linkedin',
          });
        }
      });

      return jobs;
    } catch (error: any) {
      console.error('ScraperAPI LinkedIn collection error:', error.message);
      throw new Error(`ScraperAPI collection failed: ${error.message}`);
    }
  }

  private extractDate($element: cheerio.Cheerio): Date {
    const dateText = $element.find('.job-search-card__listdate').text().trim();
    return this.parseRelativeDate(dateText);
  }

  private parseRelativeDate(dateText: string): Date {
    const now = new Date();
    const match = dateText.match(/(\d+)\s*(day|week|month|hour|minute)/i);
    
    if (!match) return now;
    
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    const date = new Date(now);
    if (unit.includes('minute')) date.setMinutes(date.getMinutes() - amount);
    else if (unit.includes('hour')) date.setHours(date.getHours() - amount);
    else if (unit.includes('day')) date.setDate(date.getDate() - amount);
    else if (unit.includes('week')) date.setDate(date.getDate() - amount * 7);
    else if (unit.includes('month')) date.setMonth(date.getMonth() - amount);
    
    return date;
  }
}

