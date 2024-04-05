import { Service, ServiceBroker } from 'moleculer';
import * as DbService from 'moleculer-db';
//@ts-ignore
import MongoDBAdapter from 'moleculer-db-adapter-mongo';
import {
  findOneAndUpdateMixin,
  updateManyMixin,
  removeManyMixin,
} from '@libs-private/service-logic/mixins';

export default class UnitTest extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker);
    this.adapter = new MongoDBAdapter(process.env.MONGO_URI);

    this.parseServiceSchema({
      name: 'unit-test-service',
      version: 1,
      mixins: [DbService],
      collection: 'unit-test',
      adapter: this.adapter,
      actions: {
        ...updateManyMixin(this),
        ...removeManyMixin(this),
        ...findOneAndUpdateMixin(this),
      },
    });
  }
}
