import { Ownership } from './generic';

export interface AuthFormData {
  [x: string]: string;
}

export type CreateEventLinkPayload = {
  version?: string;
  ttl?: number;
  environment?: string;
  usageSource?: string;
  identity?: string;
  identityType?: 'user' | 'team' | 'organization';
  group?: string;
  label?: string;
};

export interface EventLink {
  _id?: string;
  version: string;
  ownership: Ownership;
  identity?: string;
  identityType?: 'user' | 'team' | 'organization';
  group?: string;
  label?: string;
  token: string;
  createdAt: number;
  createdDate: Date;
  updatedAt?: number;
  expiresAt: number;
  environment?: string;
  usageSource?: string;
  _type: string;
}

export interface CreateEmbedConnectionPayload {
  connectionDefinitionId: string;
  linkToken: string;
  authFormData: AuthFormData & {
    name: string;
  };
  type: string;
}

export interface CreateOauthEmbedConnectionPayload {
  connectionDefinitionId: string;
  linkToken: string;
  type: string;
  code: string;
  redirectUri: string;
  clientId: string;
  formData?: { [K: string]: unknown };
  additionalData?: { [K: string]: unknown };
}
