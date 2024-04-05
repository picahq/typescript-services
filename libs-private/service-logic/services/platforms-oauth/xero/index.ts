import {
  XeroOauthPayload,
  XeroOauthRefreshPayload,
} from '@event-inc/types/platform-oauth';
import { BResult } from '@event-inc/types/results';
import { resultErr, resultOk } from '@event-inc/utils/result';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const generateXeroHeaders = (clientId: string, clientSecret: string) => {
  const credentials = clientId + ':' + clientSecret;
  const encodedCredentials = Buffer.from(credentials).toString('base64');

  return {
    authorization: 'Basic ' + encodedCredentials,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
};

export const initialXero = async ({
  metadata,
  clientId,
  clientSecret,
}: XeroOauthPayload): Promise<
  BResult<
    {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: string;
      clientId: string;
      clientSecret: string;
      metadata: {
        code: string;
        redirectUri: string;
        tenantId: string;
      };
    },
    'service',
    unknown
  >
> => {
  const response = await axios.post<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }>(
    'https://identity.xero.com/connect/token',
    {
      grant_type: 'authorization_code',
      code: metadata.code,
      redirect_uri: metadata.redirectUri,
    },
    {
      headers: generateXeroHeaders(clientId, clientSecret),
    }
  );

  const compute = {
    accessToken: response.data?.access_token,
    refreshToken: response.data?.refresh_token,
    expiresIn: response.data?.expires_in,
    tokenType: response.data?.token_type,
  };

  const decodedToken = jwt.decode(compute.accessToken) as {
    authentication_event_id: string;
  };

  const tenantId = await axios.get<
    [
      {
        id: string;
        authEventId: string;
        tenantId: string;
        tenantType: string;
        tenantName: string;
        createdDateUtc: string;
        updatedDateUtc: string;
      }
    ]
  >('https://api.xero.com/connections', {
    headers: {
      authorization: 'Bearer ' + compute.accessToken,
      'Content-Type': 'application/json',
    },
  });

  if (!tenantId.data.length) {
    return resultErr(
      false,
      'service_4000',
      'Failed to fetch tenantId from Xero API',
      'buildable-core',
      false,
      {}
    );
  }

  const extractedTenantId = tenantId.data.find(
    (tenant) => tenant.authEventId === decodedToken.authentication_event_id
  )?.tenantId;

  if (!extractedTenantId) {
    return resultErr(
      false,
      'service_4001',
      'Failed to extract tenantId from Xero API response',
      'buildable-core',
      false,
      {}
    );
  }

  const newMetadata = {
    ...metadata,
    tenantId: extractedTenantId,
  };

  const newPayload = {
    ...compute,
    clientId,
    clientSecret,
    metadata: newMetadata,
  };

  return resultOk(newPayload);
};

export const refreshXero = async ({
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
  OAUTH_REFRESH_TOKEN,
  OAUTH_METADATA,
}: XeroOauthRefreshPayload): Promise<
  BResult<
    {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: string;
      clientId: string;
      clientSecret: string;
      metadata: {
        tenantId: string;
      };
    },
    'service',
    unknown
  >
> => {
  const response = await axios.post<{
    id_token: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
  }>(
    'https://identity.xero.com/connect/token',
    {
      grant_type: 'refresh_token',
      client_id: OAUTH_CLIENT_ID,
      refresh_token: OAUTH_REFRESH_TOKEN,
    },
    {
      headers: generateXeroHeaders(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET),
    }
  );

  const compute = {
    accessToken: response.data?.access_token,
    refreshToken: response.data?.refresh_token,
    expiresIn: response.data?.expires_in,
    tokenType: response.data?.token_type,
  };

  const newPayload = {
    ...compute,
    clientId: OAUTH_CLIENT_ID,
    clientSecret: OAUTH_CLIENT_SECRET,
    metadata: {
      tenantId: OAUTH_METADATA?.metadata?.tenantId,
    },
  };

  return resultOk(newPayload);
};
