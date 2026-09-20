export interface Country {
  id: string;
  uuid: string;
  countryCode: string;
  isoAlpha2: string;
  isoAlpha3: string;
  countryName: string;
  nationality: string | null;
  phoneCode: string | null;
  currencyCode: string | null;
  timezone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export interface CreateCountryRequest {
  countryCode: string;
  isoAlpha2: string;
  isoAlpha3: string;
  countryName: string;
  nationality?: string;
  phoneCode?: string;
  currencyCode?: string;
  timezone?: string;
  isActive?: boolean;
}

export interface UpdateCountryRequest {
  version: string;
  countryCode?: string;
  isoAlpha2?: string;
  isoAlpha3?: string;
  countryName?: string;
  nationality?: string;
  phoneCode?: string;
  currencyCode?: string;
  timezone?: string;
  isActive?: boolean;
}
