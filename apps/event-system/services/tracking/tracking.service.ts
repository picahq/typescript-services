import { Context, ServiceBroker } from 'moleculer';
import { ServiceContextMeta } from '@libs-private/data-models/types/genericService';
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
import { GenericServiceProvider } from '@libs-private/service-logic/services/genericService';
import { useTrackingService } from '@libs-private/service-logic/services/tracking/useTrackingService';

export default class Tracking extends GenericServiceProvider {
  public constructor(public broker: ServiceBroker) {
    super(broker, {
      name: 'tracking',
      adapter: new MongoDBAdapter(process.env.MONGO_URI),
      version: 1,
      hooks: {},
      collection: 'tracking',
      publicActions: {
        track: [{}, publicTrack],
      },
    });
  }
}

const publicTrack = async (ctx: Context<any, ServiceContextMeta>) => {
  const { track } = useTrackingService(ctx);
  return (
    await track(
      ctx.params as {
        path: string;
        data?: any;
      }
    )
  ).unwrap();
};
