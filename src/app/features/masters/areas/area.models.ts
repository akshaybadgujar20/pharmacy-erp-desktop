export interface Area {
  id: string;
  uuid: string;
  cityId: string;
  areaCode: string;
  areaName: string;
  postalCode: string | null;
  deliveryZone: string | null;
  routeCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export interface CreateAreaRequest {
  cityId: string;
  areaCode: string;
  areaName: string;
  postalCode?: string;
  deliveryZone?: string;
  routeCode?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

export interface UpdateAreaRequest {
  version: string;
  cityId?: string;
  areaCode?: string;
  areaName?: string;
  postalCode?: string;
  deliveryZone?: string;
  routeCode?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}
