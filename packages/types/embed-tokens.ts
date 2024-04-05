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

export interface EmbedTokensPayload {
  linkSettings: {
    connectedPlatforms: Platform[];
    eventIncToken: string;
  };
  group: string;
  label: string;
  environment: string;
  ttl: number;
  sessionId?: string;
}

export interface EmbedTokenRecord {
  linkSettings: {
    connectedPlatforms: Platform[];
    eventIncToken: string;
  };
  label: string;
  group: string;
  createdAt: number;
  createdDate: Date;
  updatedAt?: number;
  expiresAt?: number;
  environment: string;
  sessionId?: string;
  _id?: string;
  formData?: object;
  response?: {
    isConnected: boolean;
    message?: string;
  };
}

export interface UpdateEmbedTokenPayload {
  sessionId: string;
  formData?: object;
  response?: {
    isConnected: boolean;
    message?: string;
  };
}
