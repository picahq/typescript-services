import { Context, ServiceBroker } from 'moleculer';
import { ServiceContextMeta } from '@libs-private/data-models/types/genericService';
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
import { GenericServiceProvider } from '@libs-private/service-logic/services/genericService';
import { useAuthkitDemoService } from '@libs-private/service-logic/services/authkit-demo/useAuthkitDemoService';

export default class AuthkitDemo extends GenericServiceProvider {
  public constructor(public broker: ServiceBroker) {
    super(broker, {
      name: 'authkit-demo',
      adapter: new MongoDBAdapter(process.env.MONGO_URI),
      version: 1,
      hooks: {},
      collection: 'sessions',
      publicActions: {
        createEmbedToken: [{}, publicCreateEmbedToken],
      },
    });
  }
}

const publicCreateEmbedToken = async (
  ctx: Context<unknown, ServiceContextMeta>
) => {
  const { createEmbedToken } = useAuthkitDemoService();
  return (await createEmbedToken()).unwrap();
};
