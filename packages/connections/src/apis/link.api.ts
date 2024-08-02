import axios from 'axios';
import { generateId } from '@integrationos/rust-utils';
import {
  CreateEventLinkPayload,
  LinkSettings,
  EventLink,
  ConnectionDefinitions,
  EmbedTokenRecord,
} from '../types';

export const createEventLinkTokenApi = async (
  headers: Record<string, string>,
  url: string,
  payload: CreateEventLinkPayload,
  secret: string
) => {
  try {
    const settings = await axios.post<LinkSettings>(
      `${url}/v1/settings/get`,
      payload,
      { headers }
    );

    const link = await axios.post<EventLink>(
      `${url}/v1/event-links/create`,
      {
        ...payload,
        environment: secret.startsWith('sk_test') ? 'test' : 'live',
        usageSource: 'sdk',
      },
      { headers }
    );

    const connectionDefinitionUrl = `${process.env.PUBLIC_API_BASE_URL}/v1/public/connection-definitions`;

    const connectionDefinitions = await axios.get<ConnectionDefinitions>(
      `${connectionDefinitionUrl}?limit=100&skip=0`
    );

    const isLiveSecret = secret.includes('sk_live');

    const activeConnectionDefinitionsData =
      connectionDefinitions?.data?.rows?.filter(
        (definition) => definition?.active
      );

    const connectedPlatforms = settings?.data?.connectedPlatforms?.filter(
      (platform) => {
        return (
          activeConnectionDefinitionsData?.find(
            (definition) => definition?._id === platform?.connectionDefinitionId
          ) && platform?.active
        );
      }
    );

    const connectedPlatformsFiltered = connectedPlatforms?.filter(
      (platform) =>
        isLiveSecret
          ? platform?.environment === 'live'
          : platform?.environment === 'test' || !platform?.environment
    );

    const tokenPayload = {
      linkSettings: {
        connectedPlatforms: connectedPlatformsFiltered ?? [],
        eventIncToken: link?.data?.token,
      },
      group: link?.data?.group,
      label: link?.data?.label,
      environment: secret.startsWith('sk_test') ? 'test' : 'live',
      expiresAt: new Date().getTime() + 5 * 1000 * 60,
      sessionId: generateId('session_id'),
      features: settings?.data?.features,
    };

    const token = await axios.post<EmbedTokenRecord>(
      `${url}/v1/embed-tokens/create`,
      tokenPayload,
      { headers }
    );
    return token.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error.response?.data;
    }
  }
};
