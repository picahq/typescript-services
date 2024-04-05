import { Context, Service } from 'moleculer';
import { Collection, FindOneAndUpdateOptions } from 'mongodb';

export const findOneAndUpdateMixin = (service: Service) => ({
  findOneAndUpdate: {
    cache: false,
    async handler(
      ctx: Context<{
        query: Record<string, unknown>;
        update: Record<string, unknown>;
        options?: FindOneAndUpdateOptions;
      }>
    ) {
      const { query, update, options } = ctx.params;
      const adapter = service.adapter.collection as Collection;
      return await (
        await adapter.findOneAndUpdate(query, update, options)
      ).value;
    },
  },
});
