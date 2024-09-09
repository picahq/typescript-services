import { Context, ServiceBroker } from 'moleculer';
import { ServiceContextMeta } from '@libs-private/data-models/types/genericService';
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
import {
  GenericServiceProvider,
  makeOwnershipFromContextMeta,
} from '@libs-private/service-logic/services/genericService';
import { useSettingsService } from '@libs-private/service-logic/services/settings/useSettingsService';
import { CreateSettingPayload } from '@event-inc/types/settings';
import { createSettingsSchema } from './schema/create.schema';

export default class Settings extends GenericServiceProvider {
  public constructor(public broker: ServiceBroker) {
    super(broker, {
      name: 'settings',
      adapter: new MongoDBAdapter(process.env.MONGO_URI),
      version: 1,
      hooks: {},
      collection: 'settings',
      publicActions: {
        create: [createSettingsSchema, publicCreateOrUpdate],
        get: [{}, publicGet],
        updateNonOauthPlatforms: [{}, publicUpdateNonOauthPlatforms]
      },
    });
  }
}

const publicCreateOrUpdate = async (
  ctx: Context<unknown, ServiceContextMeta>
) => {
  const { createOrUpdate } = useSettingsService(
    ctx,
    makeOwnershipFromContextMeta(ctx)
  );
  return (await createOrUpdate(ctx.params as CreateSettingPayload)).unwrap();
};

const publicUpdateNonOauthPlatforms = async (
  ctx: Context<unknown, ServiceContextMeta>
) => {
  const { updateNonOauthPlatforms } = useSettingsService(
    ctx,
    makeOwnershipFromContextMeta(ctx)
  );
  return (await updateNonOauthPlatforms()).unwrap();
};

const publicGet = async (ctx: Context<unknown, ServiceContextMeta>) => {
  const { get } = useSettingsService(ctx, makeOwnershipFromContextMeta(ctx));
  return (await get()).unwrap();
};
