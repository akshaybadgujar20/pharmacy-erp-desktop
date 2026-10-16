export interface LoyaltyProgram {
  id: string;
  programCode: string;
  programName: string;
  description: string | null;
  pointsPerAmount: string;
  redemptionValue: string;
  minimumRedemptionPoints: number;
  maximumRedemptionPoints: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isDefault: boolean;
  isActive: boolean;
  version: string;
}

export interface CreateLoyaltyProgramRequest {
  programCode: string;
  programName: string;
  description?: string;
  pointsPerAmount: string;
  redemptionValue: string;
  minimumRedemptionPoints: number;
  maximumRedemptionPoints?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateLoyaltyProgramRequest {
  version: string;
  programName?: string;
  description?: string;
  pointsPerAmount?: string;
  redemptionValue?: string;
  minimumRedemptionPoints?: number;
  maximumRedemptionPoints?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  isDefault?: boolean;
  isActive?: boolean;
}
