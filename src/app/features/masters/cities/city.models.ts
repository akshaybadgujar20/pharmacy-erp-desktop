export interface City {
  id: string;
  uuid: string;
  stateId: string;
  cityCode: string;
  cityName: string;
  district: string | null;
  postalRegion: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export interface CreateCityRequest {
  stateId: string;
  cityCode: string;
  cityName: string;
  district?: string;
  postalRegion?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

export interface UpdateCityRequest {
  version: number;
  stateId?: string;
  cityCode?: string;
  cityName?: string;
  district?: string;
  postalRegion?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}
