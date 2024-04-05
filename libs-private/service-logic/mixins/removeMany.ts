import { Context, Service } from 'moleculer';
import { DbAdapter } from 'moleculer-db';

export const removeManyMixin = (service: Service) => ({
  removeMany: {
    cache: false,
    async handler(
      ctx: Context<{
        query: Record<string, unknown>;
      }>
    ) {
      const { query } = ctx.params;
      const adapter = service.adapter as DbAdapter;
      return await adapter.removeMany(query);
    },
  },
});
