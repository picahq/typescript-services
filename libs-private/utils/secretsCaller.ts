import { matchResultAndHandleHttpError } from '@event-inc/utils';
import { makeHttpNetworkCall } from '@event-inc/utils/network';
import { identity } from 'ramda';

interface CreateSecretResponse {
  _id: string;
  buildableId: string;
  createdAt: number;
  author: {
    _id: string;
  };
  encryptedSecret: string;
}

export const createSecret = async (
  secret: object,
  eventAccessKey: string
): Promise<CreateSecretResponse> => {
  const results = await makeHttpNetworkCall<CreateSecretResponse>({
    url: process.env.SECRETS_SERVICE_BASE_URL + 'v1/secrets',
    method: 'POST',
    headers: {
      "x-integrationos-secret": eventAccessKey
    },
    data: {
      secret
    },
  });

  const matchedResult = matchResultAndHandleHttpError(results, identity);

  return matchedResult.data;
};

interface GetSecretResponse {
  _id: string;
  buildableId: string;
  createdAt: number;
  author: {
    _id: string;
  };
  secret: string;
}

export const getSecret = async (
  secretsServiceId: string,
  eventAccessKey: string
): Promise<GetSecretResponse> => {
  const results = await makeHttpNetworkCall<GetSecretResponse>({
    url: process.env.SECRETS_SERVICE_BASE_URL + `v1/secrets/${secretsServiceId}`,
    method: 'POST',
    headers: {
      "x-integrationos-secret": eventAccessKey
    }
  });

  const matchedResult = matchResultAndHandleHttpError(results, identity);

  return matchedResult.data;
};
