import { Context, ServiceBroker } from 'moleculer';
import { ServiceContextMeta } from '@libs-private/data-models/types/genericService';
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
import {
  GenericServiceProvider,
  makeOwnershipFromContextMeta,
} from '@libs-private/service-logic/services/genericService';
import { useEmbedTokensService } from '@libs-private/service-logic/services/embed-tokens/useEmbedTokensService';
import {
  EmbedTokensPayload,
  UpdateEmbedTokenPayload,
} from '@event-inc/types/embed-tokens';
import { updateEmbedTokenSchema } from './schema/updateEmbedToken.schema';

export default class EmbedTokens extends GenericServiceProvider {
  public constructor(public broker: ServiceBroker) {
    super(broker, {
      name: 'embed-tokens',
      adapter: new MongoDBAdapter(process.env.MONGO_URI),
      version: 1,
      hooks: {},
      collection: 'embed-tokens',
      publicActions: {
        create: [{}, publicCreate],
        get: [{}, publicGet],
        update: [updateEmbedTokenSchema, publicUpdate],
      },
    });
  }
}

const publicCreate = async (ctx: Context<unknown, ServiceContextMeta>) => {
  const { create } = useEmbedTokensService(
    ctx,
    makeOwnershipFromContextMeta(ctx)
  );
  return (await create(ctx.params as EmbedTokensPayload)).unwrap();
};

const publicGet = async (ctx: Context<unknown, ServiceContextMeta>) => {
  const { find } = useEmbedTokensService(
    ctx,
    makeOwnershipFromContextMeta(ctx)
  );
  return (await find(ctx.params as { sessionId: string })).unwrap();
};

const publicUpdate = async (ctx: Context<unknown, ServiceContextMeta>) => {
  const { updateEmbedToken } = useEmbedTokensService(
    ctx,
    makeOwnershipFromContextMeta(ctx)
  );
  return (
    await updateEmbedToken(ctx.params as UpdateEmbedTokenPayload)
  ).unwrap();
};
