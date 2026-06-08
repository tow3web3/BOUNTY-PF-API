export type BountyStatus = "active" | "completed" | "expired" | "cancelled";

export type BountyCategory = "digital_automatable" | "digital_human" | "physical";

export type EffortEstimate = "low" | "medium" | "high";

export interface NormalizedBounty {
  externalId: string;
  title: string;
  description: string;
  rewardUsd: number;
  deadline: Date | null;
  link: string;
  status: BountyStatus;
  creatorAddress: string | null;
  rawData: Record<string, unknown>;
}

export interface BountyRow {
  id: string;
  externalId: string;
  title: string;
  description: string;
  rewardUsd: string;
  deadline: Date | null;
  link: string;
  status: string;
  descriptionHash: string | null;
  creatorAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassificationResult {
  category: BountyCategory;
  confidence: number;
  effortEstimate: EffortEstimate;
  reasoning: string;
}

export interface SubscriptionFilters {
  keywords?: string[];
  minReward?: number;
  categories?: BountyCategory[];
}

export interface ApiPaginationQuery {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}
