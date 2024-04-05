import { resultOk, resultErr } from '@event-inc/utils';
import Analytics from 'analytics-node';

export const useTrackingService = (ctx: any) => {
  const client = new Analytics(process.env.SEGMENT_WRITE_KEY);

  const makePayload = (payload: any, ip: string) => {
    const { context = {} } = payload;

    return {
      ...payload,
      context: {
        ...context,
        ip,
      },
    };
  };

  return {
    async track({ path, data }: { path: string; data?: any }) {
      const ipAddress = (ctx.meta.clientIp || '').split(',')[0].trim();

      try {
        switch (path) {
          // If the type is identify, then we want to call the identify method on the analytics-node client
          case 'i':
            client.identify(makePayload(data, ipAddress));
            break;

          // If the type is track, then we want to call the track method on the analytics-node client
          case 't':
            client.track(
              makePayload(
                {
                  ...data,
                  userId: data.userId || ipAddress,
                },
                ipAddress
              )
            );
            break;
        }

        return resultOk(true);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          error.message,
          'buildable-core',
          typeof error.retryable === 'boolean' ? error.retryable : true,
          error.data
        );
      }
    },
  };
};
