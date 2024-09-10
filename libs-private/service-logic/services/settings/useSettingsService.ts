import {
  FindRequest,
  GetRequest,
  ListRequest,
  ListResponse,
  Ownership,
} from '@libs-private/data-models';
import { Services } from '@event-inc/private::types';
import { Context } from 'moleculer';
import { useGenericCRUDService } from '../genericCRUD';
import {
  Platform,
  LinkSettings as Settings,
  Feature,
} from '@event-inc/types/settings';
import { BResult } from '@event-inc/types';
import { generateSettingRecord } from '@libs-private/service-logic/generators/settings/linkSettings';
import { resultOk, resultErr } from '@event-inc/utils';
import { createSecret } from '@libs-private/utils/secretsCaller';
import EventAccess from '@apps/event-system/services/events/event-access.service';

const SERVICE_NAME = Services.Settings;

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
    }: {
      platform?: Platform;
      configuration?: {
        CLIENT_ID: string;
        CLIENT_SECRET: string;
      };
      features?: Feature[];
    }): Promise<BResult<boolean, 'service', unknown>> {
      try {
        const settingsRecord = (await _list()).unwrap().rows[0] as Settings;

        const eventAccessRecordResult = await findEventAccess<EventAccess>({
          query: {
            "ownership.buildableId": ownership.buildableId,
            "key": `event_access::custom::${platform.environment}::default::event-inc::internal-ui`
          },
        });

        const eventAccessRecord = eventAccessRecordResult.unwrap()?.[0];

        if (configuration) {
          const secretsRecord = await createSecret(
            JSON.stringify(configuration),
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

          await updateById(settingsRecord._id, {
            connectedPlatforms: settingsRecord.connectedPlatforms,
            updatedAt: new Date().getTime(),
            updatedDate: new Date().toISOString(),
            features: features?.length ? features : settingsRecord.features,
          });

          return resultOk(true);
        }

        const setting = generateSettingRecord({
          ownership,
          platform,
          features: [],
        });

        await _create<Settings>('st', setting);

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
  };
};
