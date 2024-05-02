import { ConnectionRecord } from "./connection";
export interface Platform {
  type: string;
  title: string;
  connectionDefinitionId: string;
  active?: boolean;
  image: string;
  activatedAt?: number;
  secretsServiceId?: string;
  secret?: {
    clientId: string;
    clientSecretDisplay: string;
  };
}

interface Feature {
  key: string;
  value: 'enabled' | 'disabled';
  updatedAt: number;
}

export interface EmbedTokensPayload {
  linkSettings: {
    connectedPlatforms: Platform[];
    eventIncToken: string;
  };
  group: string;
  label: string;
  environment: string;
  ttl: number;
  sessionId: string;
  features?: Feature[];
}

export interface EmbedTokenRecord {
  linkSettings: {
    connectedPlatforms: Platform[];
    eventIncToken: string;
  };
  features?: Feature[];
  label: string;
  group: string;
  createdAt: number;
  createdDate: Date;
  updatedAt?: number;
  expiresAt?: number;
  environment: string;
  sessionId: string;
  _id?: string;
  formData?: object;
  response?: {
    isConnected: boolean;
    message?: string;
    connection?: ConnectionRecord;
  };
}

export interface UpdateEmbedTokenPayload {
  sessionId: string;
  formData?: object;
  response?: {
    isConnected: boolean;
    message?: string;
    connection?: ConnectionRecord;
  };
}
