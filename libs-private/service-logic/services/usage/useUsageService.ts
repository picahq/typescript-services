import { Context } from "moleculer";
import { Ownership } from "@libs-private/data-models";
import { BResult } from "@event-inc/types";
import { Usage } from "@event-inc/types/usage";
import { resultErr, resultOk } from "@event-inc/utils";
import jwt from 'jsonwebtoken';
import { format } from 'date-fns';
import { useGenericCRUDService } from "../genericCRUD";
import { Services } from "@libs-private/data-models";

const SERVICE_NAME = Services.Usage;

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
                const authorization = headers['authorization'];

                if (!secretKey) {
                    return resultErr<'service'>(
                        false,
                        'service_4000',
                        'Secret key is required',
                        'buildable-core',
                        false
                    );
                }

                if (!authorization) {
                    return resultErr<'service'>(
                        false,
                        'service_4000',
                        'User is not authenticated',
                        'buildable-core',
                        false
                    );
                }

                const authToken = authorization.split(' ')[1];
                const decoded = jwt.decode(authToken, { complete: true }) as any;
                const environment = secretKey.startsWith('sk_live') ? 'live' : 'test';
                const clientId = decoded?.payload?.buildableId;
                const currentDate = new Date();

                const dailyKey = format(currentDate, 'yyyy-MM-dd');
                const monthlyKey = format(currentDate, 'yyyy-MM');
                const yearlyKey = format(currentDate, 'yyyy');

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
                const authorization = headers['authorization'];

                if (!secretKey) {
                    return resultErr<'service'>(
                        false,
                        'service_4000',
                        'Secret key is required',
                        'buildable-core',
                        false
                    );
                }

                if (!authorization) {
                    return resultErr<'service'>(
                        false,
                        'service_4000',
                        'User is not authenticated',
                        'buildable-core',
                        false
                    );
                }

                const authToken = authorization.split(' ')[1];
                const decoded = jwt.decode(authToken, { complete: true }) as any;
                const clientId = decoded?.payload?.buildableId;

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
