import { Context } from "moleculer";
import { Ownership } from "@libs-private/data-models";
import { BResult } from "@event-inc/types";
import { Usage } from "@event-inc/types/usage";
import { resultErr, resultOk } from "@event-inc/utils";
import { useGenericCRUDService } from "../genericCRUD";
import { Services } from "@libs-private/data-models";

const SERVICE_NAME = Services.Usage;

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return {
        daily: `${year}-${month}-${day}`,
        monthly: `${year}-${month}`,
        yearly: `${year}`
    };
};

export const useUsageService = (ctx: Context, ownership: Ownership) => {
    const { find, findAndUpdate, updateMany } = useGenericCRUDService(ctx, SERVICE_NAME, ownership, {
        DISABLE_ADDING_OWNERSHIP_CHECK: true,
    });

    return {
        async create({
            type
        }: {
            type: "buildkit" | "chat"
        }): Promise<BResult<Usage, 'service', unknown>> {
            try {
                const headers = (ctx.meta as any).request.headers;
                const secretKey = headers['x-pica-secret'];

                if (!secretKey) {
                    return resultErr<'service'>(
                        false,
                        'service_4000',
                        'Secret key is required',
                        'buildable-core',
                        false
                    );
                }

                // Get the buildableId from ctx.meta.buildable._id
                const clientId = (ctx.meta as any).buildable._id;
                const environment = secretKey.startsWith('sk_live') ? 'live' : 'test';
                const currentDate = new Date();
                const { daily: dailyKey, monthly: monthlyKey, yearly: yearlyKey } = formatDate(currentDate);

                // First, try to find the existing usage record
                const existingUsage = (await find<Usage>({ query: { clientId } })).unwrap();

                if (!existingUsage || existingUsage.length === 0) {
                    // Direct insert without ownership fields
                    await ctx.broker.call(`${SERVICE_NAME}.insert`, {
                        entities: [{
                            clientId,
                            buildkit: {
                                live: {},
                                test: {}
                            },
                            chat: {
                                live: {},
                                test: {}
                            }
                        }]
                    });
                }

                // Update the usage counts using $inc
                const updatePath = `${type}.${environment}`;
                
                const result = (await findAndUpdate<Usage>({
                    query: { clientId },
                    update: {
                        $set: {},  // Empty $set to ensure MongoDB treats this as an update operation
                        $inc: {
                            [`${updatePath}.total`]: 1,
                            [`${updatePath}.daily.${dailyKey}`]: 1,
                            [`${updatePath}.monthly.${monthlyKey}`]: 1,
                            [`${updatePath}.yearly.${yearlyKey}`]: 1
                        }
                    },
                    options: { 
                        returnDocument: 'after'
                    }
                })).unwrap();

                return resultOk(result);

            } catch (error) {
                return resultErr<'service'>(
                    false,
                    'service_4000',
                    'Something went wrong while updating usage',
                    'buildable-core',
                    false
                );
            }
        },

        async get(): Promise<BResult<Usage, 'service', unknown>> {
            try {

                const headers = (ctx.meta as any).request.headers;
                const secretKey = headers['x-pica-secret'];

                if (!secretKey) {
                    return resultErr<'service'>(
                        false,
                        'service_4000',
                        'Secret key is required',
                        'buildable-core',
                        false
                    );
                }
                
                // Get the buildableId from ctx.meta.buildable._id
                const clientId = (ctx.meta as any).buildable?._id;

                const usage = (await find<Usage>({ query: { clientId } })).unwrap();

                if (!usage || usage.length === 0) {
                    return resultOk({
                        _id: '',
                        clientId,
                        createdAt: 0,
                        buildkit: {
                            test: {
                                total: 0,
                                daily: {},
                                monthly: {},
                                yearly: {}
                            },
                            live: {
                                total: 0,
                                daily: {},
                                monthly: {},
                                yearly: {}
                            }
                        },
                        chat: {
                            test: {
                                total: 0,
                                daily: {},
                                monthly: {},
                                yearly: {}
                            },
                            live: {
                                total: 0,
                                daily: {},
                                monthly: {},
                                yearly: {}
                            }
                        }
                    })
                }

                return resultOk(usage[0] as Usage);

            } catch (error) {
                return resultErr<'service'>(
                    false,
                    'service_4000',
                    'Something went wrong while fetching usage',
                    'buildable-core',
                    false
                );
            }
        }
    };
};
