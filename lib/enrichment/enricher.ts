import { ApolloEnrichment } from './apollo';
import { CompanyEnrichment, ICPConfig } from '@/lib/types';
import { prisma } from '@/lib/db';

export class CompanyEnricher {
  private apollo: ApolloEnrichment;

  constructor() {
    this.apollo = new ApolloEnrichment();
  }

  async enrichSignal(signalId: string, icpConfig: ICPConfig): Promise<CompanyEnrichment | null> {
    const signal = await prisma.signal.findUnique({
      where: { id: signalId },
    });

    if (!signal) return null;

    // Get company enrichment from Apollo
    const enrichment = await this.apollo.enrichCompany(signal.companyName);

    if (!enrichment) return null;

    // Get employee count in target country using LinkedIn trick
    if (enrichment.companyLinkedInUrl) {
      const geoId = this.getCountryGeoId(icpConfig.targetCountry);
      enrichment.employeeCountInTargetCountry = await this.apollo.getCompanyEmployees(
        enrichment.companyLinkedInUrl,
        geoId
      );
    }

    // Find decision makers
    const decisionMakerTitles = [
      'Head of Talent Acquisition',
      'HR Director',
      'VP of People',
      'Talent Acquisition Manager',
    ];
    
    enrichment.decisionMakers = await this.apollo.findDecisionMakers(
      signal.companyName,
      decisionMakerTitles
    );

    // Store enrichment
    await prisma.enrichment.create({
      data: {
        signalId,
        companyLinkedInUrl: enrichment.companyLinkedInUrl,
        employeeCount: enrichment.employeeCount,
        employeeCountInTargetCountry: enrichment.employeeCountInTargetCountry,
        industry: enrichment.industry,
        headquarters: enrichment.headquarters,
        fundingAmount: enrichment.fundingAmount,
        fundingRound: enrichment.fundingRound,
        fundingDate: enrichment.fundingDate,
        decisionMakers: enrichment.decisionMakers as any,
      },
    });

    return enrichment;
  }

  private getCountryGeoId(country: string): string {
    // LinkedIn geo region IDs
    const geoIds: Record<string, string> = {
      'Brazil': '106057199',
      'United States': '103644278',
      'Mexico': '106300316',
      'Argentina': '100507426',
      'Colombia': '100364837',
      'Chile': '100364836',
    };
    return geoIds[country] || '';
  }

  async checkICPCompliance(signalId: string, icpConfig: ICPConfig): Promise<boolean> {
    const enrichment = await prisma.enrichment.findFirst({
      where: { signalId },
    });

    if (!enrichment) return false;

    // Check HQ location
    if (icpConfig.excludedHQCountries && enrichment.headquarters) {
      const hqCountry = this.extractCountry(enrichment.headquarters);
      if (icpConfig.excludedHQCountries.includes(hqCountry)) {
        return false;
      }
    }

    // Check employee count in target country
    if (icpConfig.maxEmployeesInTargetCountry) {
      if ((enrichment.employeeCountInTargetCountry || 0) > icpConfig.maxEmployeesInTargetCountry) {
        return false;
      }
    }

    // Check industry
    if (icpConfig.industries && enrichment.industry) {
      if (!icpConfig.industries.some(ind => enrichment.industry?.toLowerCase().includes(ind.toLowerCase()))) {
        return false;
      }
    }

    return true;
  }

  private extractCountry(location: string): string {
    // Simple extraction - in production, use a geocoding service
    const parts = location.split(',');
    return parts[parts.length - 1]?.trim() || '';
  }
}

