import { Context, Service } from 'moleculer';
import { DbAdapter } from 'moleculer-db';

export const updateManyMixin = (service: Service) => ({
  updateMany: {
    cache: false,
    async handler(
      ctx: Context<{
        query: Record<string, unknown>;
        update: Record<string, unknown>;
      }>
    ) {
      const { query, update } = ctx.params;
      const adapter = service.adapter as DbAdapter;
      return await adapter.updateMany(query, update);
    },
  },
});
