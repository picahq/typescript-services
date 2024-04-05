import { Context, ServiceBroker } from 'moleculer';
import { ServiceContextMeta } from '@libs-private/data-models/types/genericService';
import {
  GenericServiceProvider,
  makeOwnershipFromContextMeta,
} from '@libs-private/service-logic/services/genericService';
import { usePlatformsOAuthService } from '@libs-private/service-logic/services/platforms-oauth/usePlatformsOAuthService';
import {
  XeroOauthPayload,
  XeroOauthRefreshPayload,
} from '@event-inc/types/platform-oauth';
import {
  xeroOauthInitSchema,
  xeroOauthRefreshSchema,
} from './schema/xero.schema';
const MongoDBAdapter = require('moleculer-db-adapter-mongo');

export default class PlatformsOauth extends GenericServiceProvider {
  public constructor(public broker: ServiceBroker) {
    super(broker, {
      name: 'platforms-oauth',
      adapter: new MongoDBAdapter(process.env.MONGO_URI),
      version: 1,
      hooks: {},
      collection: 'connection-definitions',
      publicActions: {
        xeroInit: [xeroOauthInitSchema, publicXeroInitial],
        xeroRefresh: [xeroOauthRefreshSchema, publicXeroRefresh],
      },
    });
  }
}

const publicXeroInitial = async (ctx: Context<unknown, ServiceContextMeta>) => {
  const { initialXero: xero } = usePlatformsOAuthService(
    ctx,
    makeOwnershipFromContextMeta(ctx)
  );

  return (await xero(ctx.params as XeroOauthPayload)).unwrap();
};

const publicXeroRefresh = async (ctx: Context<unknown, ServiceContextMeta>) => {
  const { refreshXero: xero } = usePlatformsOAuthService(
    ctx,
    makeOwnershipFromContextMeta(ctx)
  );

  return (await xero(ctx.params as XeroOauthRefreshPayload)).unwrap();
};
