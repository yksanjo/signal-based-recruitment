import axios from 'axios';
import { Signal } from '@/lib/types';

/**
 * Funding signal collector
 * Integrates with Crunchbase API, PitchBook, or webhook sources
 */
export class FundingSignalCollector {
  private crunchbaseApiKey?: string;

  constructor(crunchbaseApiKey?: string) {
    this.crunchbaseApiKey = crunchbaseApiKey || process.env.CRUNCHBASE_API_KEY;
  }

  async collectFromCrunchbase(filters: {
    minAmount?: number;
    rounds?: string[];
    daysBack?: number;
  }): Promise<Signal[]> {
    if (!this.crunchbaseApiKey) {
      console.warn('Crunchbase API key not configured');
      return [];
    }

    const signals: Signal[] = [];
    const daysBack = filters.daysBack || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    try {
      // Crunchbase API v4 endpoint
      const response = await axios.get('https://api.crunchbase.com/v4/funding-rounds', {
        params: {
          user_key: this.crunchbaseApiKey,
          announced_on: `>=${cutoffDate.toISOString().split('T')[0]}`,
          funding_type: filters.rounds?.join(','),
        },
        timeout: 30000,
      });

      const rounds = response.data?.entities || [];

      for (const round of rounds) {
        const amount = round.properties?.money_raised || 0;
        if (filters.minAmount && amount < filters.minAmount) continue;

        signals.push({
          id: '', // Will be set when stored
          type: 'FUNDING_ANNOUNCEMENT',
          source: 'crunchbase',
          companyName: round.properties?.organization_name || '',
          postedDate: round.properties?.announced_on 
            ? new Date(round.properties.announced_on)
            : new Date(),
          rawData: round,
          processed: false,
        });
      }

      return signals;
    } catch (error: any) {
      console.error('Crunchbase collection error:', error.message);
      return [];
    }
  }

  async collectFromWebhook(webhookData: any): Promise<Signal[]> {
    // Parse webhook data from external sources
    const signals: Signal[] = [];

    if (Array.isArray(webhookData)) {
      for (const item of webhookData) {
        if (item.type === 'funding' || item.funding_amount) {
          signals.push({
            id: '',
            type: 'FUNDING_ANNOUNCEMENT',
            source: item.source || 'webhook',
            companyName: item.company_name || item.company || '',
            postedDate: item.date ? new Date(item.date) : new Date(),
            rawData: item,
            processed: false,
          });
        }
      }
    }

    return signals;
  }
}




