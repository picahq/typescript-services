import {
  CreateEventLinkPayload,
  LinkSettings,
  EventLink,
  ConnectionDefinitions,
} from '@event-inc/types';
import {
  makeHttpNetworkCall,
  matchResultAndHandleHttpError,
} from '@event-inc/utils';
import { identity } from 'ramda';
import { EmbedTokenRecord } from '@event-inc/types/embed-tokens';
import { generateId } from '@integrationos/rust-utils';

export const createEventLinkTokenApi = async (
  headers: Record<string, string>,
  url: string,
  payload: CreateEventLinkPayload,
  secret: string
) => {
  const settings = await makeHttpNetworkCall<LinkSettings>({
    method: 'POST',
    url: `${url}/v1/settings/get`,
    headers,
  });

  const { data } = matchResultAndHandleHttpError(settings, identity);

  const link = await makeHttpNetworkCall<EventLink>({
    method: 'POST',
    url: `${url}/v1/event-links/create`,
    headers,
    data: {
      ...payload,
      usageSource: 'demo',
    },
  });

  const { data: linkData } = matchResultAndHandleHttpError(link, identity);

  const connectionDefinitionUrl = url.includes('localhost')
    ? 'http://localhost:3005/v1/public/connection-definitions'
    : url.includes('development')
    ? 'https://development-api.integrationos.com/v1/public/connection-definitions'
    : 'https://api.integrationos.com/v1/public/connection-definitions';

  const connectionDefinitionHeaders = {
    'x-integrationos-secret': secret,
  };

  const connectionDefinitions =
    await makeHttpNetworkCall<ConnectionDefinitions>({
      method: 'GET',
      url: `${connectionDefinitionUrl}?limit=100&skip=0`,
      headers: connectionDefinitionHeaders,
    });

  const { data: connectionDefinitionsData } = matchResultAndHandleHttpError(
    connectionDefinitions,
    identity
  );

  const activeConnectionDefinitionsData =
    connectionDefinitionsData?.rows?.filter((definition) => definition?.active);

  // Remove the platforms from the settings.connectedPlatforms that are not active
  const connectedPlatforms = data?.connectedPlatforms?.filter((platform) => {
    return (
      activeConnectionDefinitionsData?.find(
        (definition) => definition?._id === platform?.connectionDefinitionId
      ) && platform?.active
    );
  });

  const tokenPayload = {
    linkSettings: {
      connectedPlatforms: connectedPlatforms ?? [],
      eventIncToken: linkData?.token,
    },
    group: linkData?.group,
    label: linkData?.label,
    environment: 'live',
    expiresAt: new Date().getTime() + 5 * 1000 * 60,
    sessionId: generateId('session_id'),
  };

  const token = await makeHttpNetworkCall<EmbedTokenRecord>({
    method: 'POST',
    url: `${url}/v1/embed-tokens/create`,
    headers,
    data: tokenPayload,
  });

  const { data: embedToken } = matchResultAndHandleHttpError(token, identity);

  return embedToken;
};
