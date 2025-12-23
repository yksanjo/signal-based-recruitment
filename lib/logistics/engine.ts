import { prisma } from '@/lib/db';
import { Signal, ActionBucket, BucketType, ICPConfig } from '@/lib/types';
import { CompanyEnricher } from '@/lib/enrichment/enricher';

export class LogisticsEngine {
  private enricher: CompanyEnricher;

  constructor() {
    this.enricher = new CompanyEnricher();
  }

  async processSignals(icpConfig: ICPConfig): Promise<ActionBucket[]> {
    // Get unprocessed signals
    const unprocessedSignals = await prisma.signal.findMany({
      where: { processed: false },
      include: { enrichments: true },
      take: 100, // Process in batches
    });

    const buckets: ActionBucket[] = [];

    for (const signal of unprocessedSignals) {
      // Enrich if not already enriched
      if (signal.enrichments.length === 0) {
        await this.enricher.enrichSignal(signal.id, icpConfig);
      }

      // Check ICP compliance
      const isCompliant = await this.enricher.checkICPCompliance(signal.id, icpConfig);
      if (!isCompliant) {
        await prisma.signal.update({
          where: { id: signal.id },
          data: { processed: true },
        });
        continue;
      }

      // Assign to buckets based on signal type and characteristics
      const bucketAssignments = await this.assignToBuckets(signal, icpConfig);
      
      for (const assignment of bucketAssignments) {
        await prisma.bucketAssignment.upsert({
          where: {
            bucketId_signalId: {
              bucketId: assignment.bucketId,
              signalId: signal.id,
            },
          },
          create: {
            bucketId: assignment.bucketId,
            signalId: signal.id,
            confidence: assignment.confidence,
          },
          update: {
            confidence: assignment.confidence,
          },
        });
      }

      // Mark signal as processed
      await prisma.signal.update({
        where: { id: signal.id },
        data: { processed: true },
      });
    }

    // Return all active buckets with their signals
    return this.getActionBuckets();
  }

  private async assignToBuckets(signal: any, icpConfig: ICPConfig): Promise<Array<{
    bucketId: string;
    confidence: number;
  }>> {
    const assignments: Array<{ bucketId: string; confidence: number }> = [];

    // Get or create buckets
    const buckets = await this.ensureBucketsExist();

    // Check job title level for SCALE bucket
    if (signal.type === 'JOB_POSTING' && signal.title) {
      const seniorTitles = ['VP', 'Head of', 'Director', 'Chief'];
      const isSenior = seniorTitles.some(title => signal.title.includes(title));
      
      if (isSenior) {
        const scaleBucket = buckets.find(b => b.type === 'SCALE');
        if (scaleBucket) {
          assignments.push({
            bucketId: scaleBucket.id,
            confidence: 0.8,
          });
        }
      }
    }

    // Check for funding signals
    if (signal.type === 'FUNDING_ANNOUNCEMENT') {
      const fundingBucket = buckets.find(b => b.type === 'FUNDING_BOOST');
      if (fundingBucket) {
        assignments.push({
          bucketId: fundingBucket.id,
          confidence: 0.9,
        });
      }
    }

    // Check for expansion signals
    if (signal.type === 'EXPANSION_SIGNAL') {
      const expansionBucket = buckets.find(b => b.type === 'EXPANSION');
      if (expansionBucket) {
        assignments.push({
          bucketId: expansionBucket.id,
          confidence: 0.85,
        });
      }
    }

    // Check for skills shift
    if (signal.type === 'SKILLS_SHIFT') {
      const skillsBucket = buckets.find(b => b.type === 'SKILLS_SHIFT');
      if (skillsBucket) {
        assignments.push({
          bucketId: skillsBucket.id,
          confidence: 0.75,
        });
      }
    }

    return assignments;
  }

  private async ensureBucketsExist() {
    const bucketTypes: Array<{ type: BucketType; name: string; description: string }> = [
      {
        type: 'POACH',
        name: 'The Poach',
        description: 'Companies undergoing merger or restructuring',
      },
      {
        type: 'SCALE',
        name: 'The Scale',
        description: 'Companies that just hired VP-level, need to scale team',
      },
      {
        type: 'SKILLS_SHIFT',
        name: 'The Skills Shift',
        description: 'Companies changing tech stack',
      },
      {
        type: 'EXPANSION',
        name: 'The Expansion',
        description: 'Companies opening new offices',
      },
      {
        type: 'FUNDING_BOOST',
        name: 'The Funding Boost',
        description: 'Recently funded startups',
      },
    ];

    const buckets = [];
    for (const bucketData of bucketTypes) {
      const bucket = await prisma.actionBucket.upsert({
        where: { type: bucketData.type },
        create: bucketData,
        update: bucketData,
      });
      buckets.push(bucket);
    }

    return buckets;
  }

  async getActionBuckets(): Promise<ActionBucket[]> {
    const buckets = await prisma.actionBucket.findMany({
      where: { active: true },
      include: {
        assignments: {
          include: {
            signal: {
              include: {
                enrichments: true,
              },
            },
          },
        },
      },
      orderBy: { priority: 'desc' },
    });

    return buckets.map(bucket => ({
      id: bucket.id,
      type: bucket.type as BucketType,
      name: bucket.name,
      description: bucket.description || undefined,
      priority: bucket.priority,
      signals: bucket.assignments.map(a => ({
        id: a.signal.id,
        type: a.signal.type as any,
        source: a.signal.source,
        title: a.signal.title || undefined,
        companyName: a.signal.companyName,
        companyUrl: a.signal.companyUrl || undefined,
        jobUrl: a.signal.jobUrl || undefined,
        location: a.signal.location || undefined,
        postedDate: a.signal.postedDate || undefined,
        processed: a.signal.processed,
        enrichment: a.signal.enrichments[0] ? {
          companyLinkedInUrl: a.signal.enrichments[0].companyLinkedInUrl || undefined,
          employeeCount: a.signal.enrichments[0].employeeCount || undefined,
          employeeCountInTargetCountry: a.signal.enrichments[0].employeeCountInTargetCountry || undefined,
          industry: a.signal.enrichments[0].industry || undefined,
          headquarters: a.signal.enrichments[0].headquarters || undefined,
          fundingAmount: a.signal.enrichments[0].fundingAmount || undefined,
          fundingRound: a.signal.enrichments[0].fundingRound || undefined,
          fundingDate: a.signal.enrichments[0].fundingDate || undefined,
          decisionMakers: a.signal.enrichments[0].decisionMakers as any,
        } : undefined,
      })),
      candidateCount: 0, // Will be populated by orchestration layer
    }));
  }
}




