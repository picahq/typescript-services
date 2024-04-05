import { ServiceBroker, Context } from 'moleculer';
import { ServiceContextMeta } from '@libs-private/data-models/types/genericService';
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
import {
  GenericServiceProvider,
  makeOwnershipFromContextMeta,
} from '@libs-private/service-logic/services/genericService';
import { useConnectionModelTestingService } from '@libs-private/service-logic/services/connection-testing/useConnectionTestingService';
import { testConnectionModelSchema } from './schema/test.schema';
import { TestConnectionModelParams } from '@event-inc/types/connection-testing';

export default class ConnectionTesting extends GenericServiceProvider {
  constructor(public broker: ServiceBroker) {
    super(broker, {
      name: 'connection-testing',
      adapter: new MongoDBAdapter(process.env.MONGO_URI),
      collection: 'connection-model-definitions',
      version: 1,
      events: {},
      publicActions: {
        testConnectionModel: [testConnectionModelSchema, publicTestModel],
      },
    });
  }
}

const publicTestModel = async (
  ctx: Context<TestConnectionModelParams, ServiceContextMeta>
) => {
  const { testModel } = useConnectionModelTestingService(
    ctx,
    makeOwnershipFromContextMeta(ctx)
  );

  return (await testModel(ctx.params)).unwrap();
};
