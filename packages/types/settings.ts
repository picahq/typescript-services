import { Ownership } from './generic';

export interface Platform {
  type: string;
  scopes?: string;
  title: string;
  connectionDefinitionId: string;
  active: boolean;
  image: string;
  activatedAt?: number;
  secretsServiceId?: string;
  secret?: {
    clientId: string;
    clientSecretDisplay: string;
  };
  environment?: 'test' | 'live';
}

export interface Feature {
  key: string;
  value: 'enabled' | 'disabled';
  updatedAt: number;
}

export interface LinkSettings {
  _id?: string;
  ownership: Ownership;
  connectedPlatforms: Platform[];
  createdAt: number;
  updatedAt: number;
  createdDate: Date;
  updatedDate: Date;
  features?: Feature[];
}

export interface ListLinkSettings {
  rows: LinkSettings[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateSettingPayload {
  platform: Platform;
  configuration?: {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
  };
  features?: Feature[];
}
