import axios from 'axios';
import { CompanyEnrichment } from '@/lib/types';

export class ApolloEnrichment {
  private apiKey: string;
  private baseUrl = 'https://api.apollo.io/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.APOLLO_API_KEY || '';
  }

  async enrichCompany(companyName: string): Promise<CompanyEnrichment | null> {
    if (!this.apiKey) {
      console.warn('Apollo API key not configured');
      return this.mockEnrichment(companyName);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/mixed_people/search`,
        {
          api_key: this.apiKey,
          q_keywords: companyName,
          per_page: 1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        }
      );

      const company = response.data?.organizations?.[0];
      if (!company) return null;

      return {
        companyLinkedInUrl: company.linkedin_url,
        employeeCount: company.estimated_num_employees,
        industry: company.industry,
        headquarters: company.primary_location,
      };
    } catch (error) {
      console.error('Apollo enrichment error:', error);
      return this.mockEnrichment(companyName);
    }
  }

  async getCompanyEmployees(companyLinkedInUrl: string, countryGeoId?: string): Promise<number> {
    // In production, use Apollo's employee search API
    // For now, return mock data
    return Math.floor(Math.random() * 500);
  }

  async findDecisionMakers(companyName: string, titles: string[]): Promise<Array<{
    name: string;
    title: string;
    email?: string;
    linkedIn?: string;
  }>> {
    if (!this.apiKey) {
      return this.mockDecisionMakers();
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/mixed_people/search`,
        {
          api_key: this.apiKey,
          person_titles: titles,
          organization_name: companyName,
          per_page: 10,
        }
      );

      return response.data?.people?.map((person: any) => ({
        name: person.name,
        title: person.title,
        email: person.email,
        linkedIn: person.linkedin_url,
      })) || [];
    } catch (error) {
      console.error('Apollo decision makers error:', error);
      return this.mockDecisionMakers();
    }
  }

  private mockEnrichment(companyName: string): CompanyEnrichment {
    return {
      companyLinkedInUrl: `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
      employeeCount: Math.floor(Math.random() * 1000) + 50,
      employeeCountInTargetCountry: Math.floor(Math.random() * 100),
      industry: 'Technology',
      headquarters: 'San Francisco, CA, US',
      fundingAmount: Math.random() * 10000000,
      fundingRound: 'Series A',
      fundingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };
  }

  private mockDecisionMakers(): Array<{
    name: string;
    title: string;
    email?: string;
    linkedIn?: string;
  }> {
    return [
      {
        name: 'Jane Smith',
        title: 'Head of Talent Acquisition',
        email: 'jane.smith@example.com',
        linkedIn: 'https://linkedin.com/in/janesmith',
      },
      {
        name: 'John Doe',
        title: 'HR Director',
        email: 'john.doe@example.com',
        linkedIn: 'https://linkedin.com/in/johndoe',
      },
    ];
  }
}

