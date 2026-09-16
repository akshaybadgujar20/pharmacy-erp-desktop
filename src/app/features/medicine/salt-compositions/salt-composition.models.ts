export interface SaltComposition {
  id: string;
  uuid: string;
  genericId: string;
  unitId: string;
  compositionCode: string;
  strength: string;
  strengthUnit: string;
  description: string | null;
  isActive: boolean;
  version: number;
}

export interface CreateSaltCompositionRequest {
  genericId: string;
  unitId: string;
  compositionCode: string;
  strength: string;
  strengthUnit: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateSaltCompositionRequest {
  version: number;
  genericId?: string;
  unitId?: string;
  compositionCode?: string;
  strength?: string;
  strengthUnit?: string;
  description?: string;
  isActive?: boolean;
}
