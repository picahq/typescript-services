import { GenericServiceProvider, makeOwnershipFromContextMeta } from '@libs-private/service-logic/services/genericService';
import { ServiceBroker, Context } from 'moleculer';
import { createEarlyAccessSchema } from './schema/create.schema';
import { useEarlyAccessService } from '@libs-private/service-logic/services/early-access/useEarlyAccessService';
import { CreateEarlyAccessPayload } from '@event-inc/types/early-access';
import { ServiceContextMeta } from '@libs-private/data-models/types/genericService';
const MongoDBAdapter = require('moleculer-db-adapter-mongo');

export default class EarlyAccess extends GenericServiceProvider {
    public constructor(public broker: ServiceBroker) {
        super(broker, {
            name: 'early-access',
            adapter: new MongoDBAdapter(process.env.MONGO_URI),
            version: 1,
            hooks: {},
            collection: 'early-access',
            publicActions: {
                create: [createEarlyAccessSchema, publicCreate]
            }
        });
    }
}

const publicCreate = async (ctx: Context<unknown, ServiceContextMeta>) => {
    const { create } = useEarlyAccessService(ctx, makeOwnershipFromContextMeta(ctx));
    return (await create(ctx.params as CreateEarlyAccessPayload)).unwrap();
}

