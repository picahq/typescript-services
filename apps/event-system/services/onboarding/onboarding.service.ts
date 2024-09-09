import { Context, ServiceBroker } from 'moleculer';
import { ServiceContextMeta } from '@libs-private/data-models/types/genericService';
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
import {
  GenericServiceProvider,
  makeOwnershipFromContextMeta,
} from '@libs-private/service-logic/services/genericService';
import { useOnboardingService } from '@libs-private/service-logic/services/onboarding/useOnboardingService';
import { initOnboardingSchema } from './schema/init.schema';

export default class Settings extends GenericServiceProvider {
  public constructor(public broker: ServiceBroker) {
    super(broker, {
      name: 'onboarding',
      adapter: new MongoDBAdapter(process.env.MONGO_URI),
      version: 1,
      hooks: {},
      collection: 'onboarding',
      publicActions: {
        init: [initOnboardingSchema, publicInit],
      },
    });
  }
}

const publicInit = async (
  ctx: Context<unknown, ServiceContextMeta>
) => {
  const { init } = useOnboardingService(
    ctx,
    makeOwnershipFromContextMeta(ctx)
  );
  return (await init(ctx.params as {id: string, name: string, email?: string})).unwrap();
};