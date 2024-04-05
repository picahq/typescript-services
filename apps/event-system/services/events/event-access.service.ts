import { ServiceBroker } from 'moleculer';
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
import { GenericServiceProvider } from '@libs-private/service-logic/services/genericService';

export default class EventAccess extends GenericServiceProvider {
  constructor(public broker: ServiceBroker) {
    super(broker, {
      name: 'event-access',
      adapter: new MongoDBAdapter(process.env.MONGO_URI),
      collection: 'event-access',
      version: 2,
    });
  }
}
