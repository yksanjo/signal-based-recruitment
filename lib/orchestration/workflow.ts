import { prisma } from '@/lib/db';
import { ActionBucket, CandidateProfile, ICPConfig } from '@/lib/types';
import { ApolloEnrichment } from '@/lib/enrichment/apollo';

export class OrchestrationWorkflow {
  private apollo: ApolloEnrichment;

  constructor() {
    this.apollo = new ApolloEnrichment();
  }

  async triggerWorkflow(bucketId: string, icpConfig: ICPConfig): Promise<CandidateProfile[]> {
    const bucket = await prisma.actionBucket.findUnique({
      where: { id: bucketId },
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
    });

    if (!bucket || bucket.assignments.length === 0) {
      return [];
    }

    // Get the primary signal (highest confidence)
    const primaryAssignment = bucket.assignments.sort(
      (a, b) => b.confidence - a.confidence
    )[0];
    const signal = primaryAssignment.signal;

    // Define ideal candidate profile based on bucket type
    const idealProfile = this.getIdealCandidateProfile(bucket.type, signal);

    // Fetch candidates from Apollo/Clay (on-demand)
    const candidates = await this.fetchCandidates(signal.companyName, idealProfile);

    // Score candidates by likelihood to move
    const scoredCandidates = candidates.map(candidate => ({
      ...candidate,
      likelihoodToMove: this.calculateLikelihoodToMove(candidate),
    }));

    // Filter and sort by likelihood
    const topCandidates = scoredCandidates
      .filter(c => (c.likelihoodToMove || 0) > 0.5)
      .sort((a, b) => (b.likelihoodToMove || 0) - (a.likelihoodToMove || 0))
      .slice(0, 10);

    // Store candidates
    for (const candidate of topCandidates) {
      await prisma.candidateProfile.create({
        data: {
          bucketId,
          name: candidate.name,
          title: candidate.title,
          company: candidate.company,
          location: candidate.location,
          linkedInUrl: candidate.linkedInUrl,
          email: candidate.email,
          tenure: candidate.tenure,
          likelihoodToMove: candidate.likelihoodToMove,
          skills: candidate.skills,
          source: 'apollo',
        },
      });
    }

    return topCandidates;
  }

  private getIdealCandidateProfile(bucketType: string, signal: any): {
    titles?: string[];
    skills?: string[];
    experience?: string;
  } {
    switch (bucketType) {
      case 'SCALE':
        return {
          titles: ['Senior Engineer', 'Lead Engineer', 'Engineering Manager'],
          experience: '5+ years',
        };
      case 'FUNDING_BOOST':
        return {
          titles: ['Head of Engineering', 'CTO', 'VP Engineering'],
          experience: '10+ years',
        };
      case 'EXPANSION':
        return {
          titles: ['Country Manager', 'Regional Director', 'Head of Operations'],
          experience: '7+ years',
        };
      default:
        return {};
    }
  }

  private async fetchCandidates(
    companyName: string,
    idealProfile: { titles?: string[]; skills?: string[]; experience?: string }
  ): Promise<CandidateProfile[]> {
    // In production, use Apollo/Clay API to fetch candidates
    // For now, return mock candidates
    return this.mockCandidates(companyName, idealProfile);
  }

  private mockCandidates(
    companyName: string,
    idealProfile: { titles?: string[]; skills?: string[] }
  ): CandidateProfile[] {
    const titles = idealProfile.titles || ['Software Engineer', 'Product Manager'];
    
    return titles.map((title, i) => ({
      id: `candidate-${i}`,
      name: `Candidate ${i + 1}`,
      title,
      company: companyName,
      location: 'São Paulo, Brazil',
      linkedInUrl: `https://linkedin.com/in/candidate${i}`,
      email: `candidate${i}@example.com`,
      tenure: Math.floor(Math.random() * 36) + 12, // 12-48 months
      skills: idealProfile.skills || ['JavaScript', 'TypeScript', 'React'],
    }));
  }

  private calculateLikelihoodToMove(candidate: CandidateProfile): number {
    // Higher tenure = higher likelihood to move (2+ years is ideal)
    let score = 0.5;

    if (candidate.tenure) {
      if (candidate.tenure >= 24) {
        score += 0.3; // 2+ years
      } else if (candidate.tenure >= 12) {
        score += 0.1; // 1+ years
      }
    }

    // Add some randomness for demo
    score += Math.random() * 0.2 - 0.1;

    return Math.min(1, Math.max(0, score));
  }

  async getCandidatesForBucket(bucketId: string): Promise<CandidateProfile[]> {
    const candidates = await prisma.candidateProfile.findMany({
      where: { bucketId },
      orderBy: { likelihoodToMove: 'desc' },
    });

    return candidates.map(c => ({
      id: c.id,
      name: c.name,
      title: c.title || undefined,
      company: c.company || undefined,
      location: c.location || undefined,
      linkedInUrl: c.linkedInUrl || undefined,
      email: c.email || undefined,
      tenure: c.tenure || undefined,
      likelihoodToMove: c.likelihoodToMove || undefined,
      skills: c.skills,
    }));
  }
}

