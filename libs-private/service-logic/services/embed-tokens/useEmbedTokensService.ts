import { Context } from 'moleculer';
import { Ownership, Services } from '@libs-private/data-models';
import { BResult } from '@event-inc/types';
import { useGenericCRUDService } from '../genericCRUD';
import {
  EmbedTokenRecord,
  EmbedTokensPayload,
  UpdateEmbedTokenPayload,
} from '@event-inc/types/embed-tokens';
import { resultErr, resultOk } from '@event-inc/utils';

const SERVICE_NAME = Services.EmbedTokens;

export const useEmbedTokensService = (ctx: Context, ownership: Ownership) => {
  const {
    create: _create,
    find: _find,
    updateById,
  } = useGenericCRUDService(ctx, SERVICE_NAME, ownership, {
    DISABLE_ADDING_OWNERSHIP_CHECK: true,
  });

  return {
    async create(
      payload: EmbedTokensPayload
    ): Promise<BResult<EmbedTokenRecord, 'service', unknown>> {
      return await _create<EmbedTokenRecord>('embed_tk', payload);
    },

    async updateEmbedToken({
      sessionId,
      formData,
      response,
    }: UpdateEmbedTokenPayload): Promise<
      BResult<EmbedTokenRecord | {}, 'service', unknown>
    > {
      try {
        const embedToken = await _find<EmbedTokenRecord>({
          query: {
            sessionId,
          },
        });

        const embedTokenRecord = embedToken.unwrap();

        const expiresAt = new Date().getTime();

        const updatedFormData = formData ?? embedTokenRecord?.[0]?.formData;
        const updatedResponse = response ?? embedTokenRecord?.[0]?.response;
        const updatedExpiresAt = formData
          ? embedTokenRecord?.[0]?.expiresAt
          : expiresAt;

        const result = {
          ...embedTokenRecord?.[0],
          ...(updatedFormData && { formData: updatedFormData }),
          ...(updatedResponse && { response: updatedResponse }),
          expiresAt: updatedExpiresAt,
        };

        await updateById<EmbedTokenRecord>(embedTokenRecord?.[0]?._id, result);

        return resultOk<EmbedTokenRecord>(result);
      } catch (err) {
        return resultErr<'service'>(
          false,
          'service_4001',
          err?.data?.data?.error || 'Token not found',
          'buildable-core',
          false
        );
      }
    },
    async find({
      sessionId,
    }: {
      sessionId: string;
    }): Promise<BResult<EmbedTokenRecord[], 'service', unknown>> {
      return await _find<EmbedTokenRecord>({
        query: {
          sessionId,
        },
      });
    },
  };
};
