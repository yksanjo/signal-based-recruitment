export type SignalType = 
  | 'JOB_POSTING'
  | 'FUNDING_ANNOUNCEMENT'
  | 'EXPANSION_SIGNAL'
  | 'HIRING_SPIKE'
  | 'SKILLS_SHIFT'
  | 'MERGER_ACQUISITION';

export type BucketType = 
  | 'POACH'
  | 'SCALE'
  | 'SKILLS_SHIFT'
  | 'EXPANSION'
  | 'FUNDING_BOOST';

export interface JobPosting {
  title: string;
  company: string;
  location?: string;
  url: string;
  postedDate?: Date;
  source: 'linkedin' | 'indeed' | 'glassdoor';
  description?: string;
}

export interface CompanyEnrichment {
  companyLinkedInUrl?: string;
  employeeCount?: number;
  employeeCountInTargetCountry?: number;
  industry?: string;
  headquarters?: string;
  fundingAmount?: number;
  fundingRound?: string;
  fundingDate?: Date;
  decisionMakers?: Array<{
    name: string;
    title: string;
    email?: string;
    linkedIn?: string;
  }>;
}

export interface ICPConfig {
  targetCountry: string;
  excludedHQCountries?: string[];
  minJobTitleLevel?: string[]; // ['VP', 'Head of', 'Director']
  requiredLanguages?: string[];
  maxEmployeesInTargetCountry?: number;
  industries?: string[];
  minFundingAmount?: number;
}

export interface Signal {
  id: string;
  type: SignalType;
  source: string;
  title?: string;
  companyName: string;
  companyUrl?: string;
  jobUrl?: string;
  location?: string;
  postedDate?: Date;
  rawData?: any;
  processed: boolean;
  enrichment?: CompanyEnrichment;
}

export interface ActionBucket {
  id: string;
  type: BucketType;
  name: string;
  description?: string;
  priority: number;
  signals: Signal[];
  candidateCount?: number;
}

export interface CandidateProfile {
  id: string;
  name: string;
  title?: string;
  company?: string;
  location?: string;
  linkedInUrl?: string;
  email?: string;
  tenure?: number;
  likelihoodToMove?: number;
  skills: string[];
}

