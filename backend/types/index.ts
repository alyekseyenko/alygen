/**
 * Global Type Definitions (Senior Level 5: Type Safety)
 */

export interface PixelDetails {
  facebook: boolean;
  ga4: boolean;
  gtm: boolean;
  hotjar: boolean;
  totalTracking: number;
}

export interface MetricScore {
  score: number;
  status: 'good' | 'average' | 'poor';
}

export interface Analysis {
  id?: string;
  url: string;
  performanceMobile: number;
  performanceDesktop: number;
  qScore: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  pixelDetails: PixelDetails;
  seo: { score: number };
  security: { score: number; hasSSL: boolean };
  accessibility: { score: number };
  extractedEmails: string[];
  extractedPhones: string[];
  mockupUrl?: string;
  lastAnalyzedAt: string;
  is_immune?: boolean;
  crm_stage?: string;
}

export interface Lead {
  id: string;
  name: string;
  website: string;
  type?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  analysis?: Analysis;
  sequenceStatus?: {
    status: string;
    open_count: number;
    last_event?: string;
  };
}

export interface Job {
  id: number;
  leadData: Lead;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  addedAt: string;
  error?: string;
}
