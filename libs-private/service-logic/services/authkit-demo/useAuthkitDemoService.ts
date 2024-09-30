import { BResult } from '@event-inc/types';
import { resultErr, resultOk } from '@event-inc/utils';
import { v4 as uuidv4 } from 'uuid';
import { EmbedToken } from './client';
import { EmbedTokenRecord } from '@event-inc/types/embed-tokens';

export const useAuthkitDemoService = () => {
  return {
    async createEmbedToken(): Promise<
      BResult<EmbedTokenRecord, 'service', unknown>
    > {
      const embedToken = new EmbedToken(
        process.env.DEMO_ACCOUNT_EVENT_ACCESS_KEY as string
      );
      try {
        const token = await embedToken.create({
          ttl: 2 * 1000 * 60 * 60,
        });

        return resultOk(token);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          error?.data?.data?.error || 'Something went wrong',
          'buildable-core',
          false
        );
      }
    },
  };
};
