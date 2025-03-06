import {
  FindRequest,
  Ownership,
} from '@libs-private/data-models';
import { Services } from '@event-inc/private::types';
import { Context } from 'moleculer';
import { useGenericCRUDService } from '../genericCRUD';
import {
  Platform,
  LinkSettings as Settings,
  Feature,
  BuildKitIntegration,
} from '@event-inc/types/settings';
import EventAccess from '@apps/event-system/services/events/event-access.service';
import { BResult, ConnectionDefinitions } from '@event-inc/types';
import { generateSettingsRecord } from '@libs-private/service-logic/generators/settings/linkSettings';
import { resultOk, resultErr, makeHttpNetworkCall, matchResultAndHandleHttpError } from '@event-inc/utils';
import { createSecret } from '@libs-private/utils/secretsCaller';
import { identity } from 'ramda';

const SERVICE_NAME = Services.Settings;
const LIST_CONNECTION_DEFINITIONS_URL = process.env.CONNECTIONS_API_BASE_URL + 'v1/public/connection-definitions';

type ENVIRONMENT = 'test' | 'live';

export const useSettingsService = (ctx: Context, ownership: Ownership) => {
  const {
    create: _create,
    list: _list,
    find,
    updateById,
  } = useGenericCRUDService(ctx, SERVICE_NAME, ownership);

  const { find: findEventAccess } = useGenericCRUDService(
    ctx,
    Services.EventAccess,
    ownership,
    {
      DISABLE_ADDING_OWNERSHIP_CHECK: true,
    }
  );

  return {
    find,
    async get(props: FindRequest = {}): Promise<BResult<Settings, 'service'>> {
      const settingsRecordResult = await find<Settings>(props);

      const settingsRecord = settingsRecordResult.unwrap()[0];

      if (settingsRecord) {
        for (let platform of settingsRecord.connectedPlatforms) {
          if (platform.secretsServiceId) delete platform.secretsServiceId;
        }
      }

      return resultOk(settingsRecord);
    },
    async createOrUpdate({
      platform,
      configuration,
      features,
      buildKitIntegration,
    }: {
      platform?: Platform;
      configuration?: {
        CLIENT_ID: string;
        CLIENT_SECRET: string;
      };
      features?: Feature[];
      buildKitIntegration?: BuildKitIntegration;
    }): Promise<BResult<boolean, 'service', unknown>> {
      try {
        const settingsRecord = (await _list()).unwrap().rows[0] as Settings;

        const eventAccessRecordResult = await findEventAccess<EventAccess>({
          query: {
            "ownership.buildableId": ownership.buildableId,
            "key": `event_access::custom::${platform?.environment || "test"}::default::event-inc::internal-ui`
          },
        });

        const eventAccessRecord = eventAccessRecordResult.unwrap()?.[0];

        if (configuration) {
          const secretsRecord = await createSecret(
            configuration,
            eventAccessRecord?.accessKey
          );

          platform.secretsServiceId = secretsRecord._id;
          platform.secret = {
            clientId: configuration.CLIENT_ID,
            clientSecretDisplay:
              configuration.CLIENT_SECRET.slice(0, 5) +
              '*****' +
              configuration.CLIENT_SECRET.slice(-5),
          };
        }

        if (settingsRecord) {
          if (platform) {
            const platformIndex = settingsRecord.connectedPlatforms.findIndex(
              (connectedPlatform) =>
                connectedPlatform.connectionDefinitionId ===
                platform.connectionDefinitionId && (connectedPlatform?.environment || "test") === platform?.environment
            );

            if (platformIndex !== -1) {
              settingsRecord.connectedPlatforms[platformIndex] = {
                ...settingsRecord.connectedPlatforms[platformIndex],
                ...platform,
              };
            } else {
              settingsRecord.connectedPlatforms.push(platform);
            }
          }

          if (buildKitIntegration) {
             if (!settingsRecord.buildKitIntegrations) {
              settingsRecord.buildKitIntegrations = [];
            }

            if (buildKitIntegration.active) {
              settingsRecord.buildKitIntegrations.push({
                connectionDefinitionId: buildKitIntegration.connectionDefinitionId,
                environment: buildKitIntegration.environment,
                platformName: buildKitIntegration.platformName,
              });
            } else {
              settingsRecord.buildKitIntegrations = settingsRecord.buildKitIntegrations.filter(
                integration => 
                  !(integration.connectionDefinitionId === buildKitIntegration.connectionDefinitionId && 
                    integration.environment === buildKitIntegration.environment)
              );
            }
          }

          await updateById(settingsRecord._id, {
            connectedPlatforms: settingsRecord.connectedPlatforms,
            updatedAt: new Date().getTime(),
            updatedDate: new Date().toISOString(),
            features: features?.length ? features : settingsRecord.features,
            buildKitIntegrations: settingsRecord.buildKitIntegrations || [],
          });

          return resultOk(true);
        }

        const settings = generateSettingsRecord({
          ownership,
          platforms: [platform],
          features: [],
          buildKitIntegrations: []
        });

        await _create<Settings>('st', settings);

        return resultOk(true);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          error.message,
          'buildable-core',
          typeof error.retryable === 'boolean' ? error.retryable : true,
          error.data
        );
      }
    },

    // Create a function to create the settings for non oauth platforms
    async updateNonOauthPlatforms(): Promise<BResult<boolean, 'service', unknown>> {
      try {
        const connectionDefinitions = await makeHttpNetworkCall<ConnectionDefinitions>({
          method: 'GET',
          url: `${LIST_CONNECTION_DEFINITIONS_URL}?limit=100&skip=0&active=true`,
        });

        const { data } =
          matchResultAndHandleHttpError(connectionDefinitions, identity);

        let platforms = [];

        for (const connectionDefinition of data?.rows) {
          if (!connectionDefinition?.settings?.oauth) {
            const platform = {
              connectionDefinitionId: connectionDefinition?._id,
              type: connectionDefinition?.frontend?.spec?.platform,
              active: true,
              activatedAt: new Date().getTime(),
              image: connectionDefinition?.frontend?.spec?.image,
              title: connectionDefinition?.frontend?.spec?.title,
              environment: 'test' as ENVIRONMENT,
            };

            platforms.push(platform);

          }
        }

        const settings = generateSettingsRecord({
          ownership,
          platforms,
          features: [],
          buildKitIntegrations: [],
        });

        await _create<Settings>('st', settings);

        return resultOk(true);


      }
      catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          error.message,
          'buildable-core',
          typeof error.retryable === 'boolean' ? error.retryable : true,
          error.data
        );
      }
    },

  };
};
