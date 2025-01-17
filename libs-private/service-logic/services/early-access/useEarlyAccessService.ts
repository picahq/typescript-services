import { Context } from 'moleculer';
import { Ownership, Services } from '@libs-private/data-models';
import { useGenericCRUDService } from '@libs-private/service-logic/service-helper';
import { CreateEarlyAccessPayload } from '@event-inc/types/early-access';
import jwt from 'jsonwebtoken';

export const useEarlyAccessService = (ctx: Context, ownership: Ownership) => {

    const SERVICE_NAME = Services.EarlyAccess;

    const {
        create: _create,
    } = useGenericCRUDService(ctx, SERVICE_NAME, ownership, {
        DISABLE_ADDING_OWNERSHIP_CHECK: true,
    });

    return {
        async create(payload: CreateEarlyAccessPayload) {

            const authorization = (ctx.meta as any).request.headers['authorization'];
            const authToken = authorization.split(' ')[1];
            const decoded: any = jwt.decode(authToken, { complete: true });

            const userId = decoded?.payload?._id;;
            const email = decoded?.payload?.email;

            const finalPayload = {
                ...payload,
                userId,
                email
            }

            return await _create("ea", finalPayload);

        }
    }

}