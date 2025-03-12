import { GenericServiceProvider, makeOwnershipFromContextMeta } from "@libs-private/service-logic/services/genericService";
import { ServiceBroker, Context } from "moleculer";
import MongoDBAdapter from 'moleculer-db-adapter-mongo';
import { createUsageSchema } from "./schema/create.schema";
import { ServiceContextMeta } from "@libs-private/data-models/types/genericService";
import { useUsageService } from "@libs-private/service-logic/services/usage/useUsageService";
export default class Usage extends GenericServiceProvider {
    public constructor(public broker: ServiceBroker) {
        super(broker, {
            name: 'usage',
            adapter: new MongoDBAdapter(process.env.MONGO_URI),
            version: 1,
            collection: 'usage',
            hooks: {},
            publicActions: {
                create: [createUsageSchema, createUsage],
                get: [{}, getUsage],
            }
        });
    }
}

const createUsage = async (ctx: Context<unknown, ServiceContextMeta>) => {
    const { create } = useUsageService(ctx, makeOwnershipFromContextMeta(ctx));
    return (await create(ctx.params as {
        type: 'buildkit' | 'chat'
    })).unwrap();
};

const getUsage = async (ctx: Context<unknown, ServiceContextMeta>) => {
    const { get } = useUsageService(ctx, makeOwnershipFromContextMeta(ctx));
    return (await get()).unwrap();
};
