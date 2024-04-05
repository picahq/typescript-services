export type XeroOauthPayload = {
  metadata?: {
    code: string;
    redirectUri: string;
  };
  clientId: string;
  clientSecret: string;
};

export type XeroOauthRefreshPayload = {
  OAUTH_CLIENT_ID?: string;
  OAUTH_CLIENT_SECRET?: string;
  OAUTH_ACCESS_TOKEN?: string;
  OAUTH_REFRESH_TOKEN?: string;
  OAUTH_EXPIRES_IN?: number;
  OAUTH_METADATA?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    clientId: string;
    clientSecret: string;
    metadata: {
      tenantId: string;
    };
  };
  OAUTH_REQUEST_PAYLOAD?: string;
};
