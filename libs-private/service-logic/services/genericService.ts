import {
  Context,
  Service,
  ServiceBroker,
  ServiceHooks,
  ServiceEvents,
  ServiceActionsSchema,
  ActionParamSchema,
  ActionHandler,
} from 'moleculer';
import * as DbService from 'moleculer-db';
import { Ownership } from '@libs-private/data-models';
import { ServiceContextMeta } from '@libs-private/data-models/types/genericService';
import {
  findOneAndUpdateMixin,
  removeManyMixin,
  updateManyMixin,
} from '../mixins';

const disableCacheOnDefaultActions = () =>
  ['list', 'find', 'update', 'remove', 'get', 'count'].reduce(
    (acc, curr) => ({
      ...acc,
      [curr]: {
        cache: false,
      },
    }),
    {}
  );

export class GenericServiceProvider extends Service {
  public constructor(
    public broker: ServiceBroker,
    {
      name,
      adapter,
      collection,
      version = 1,
      hooks = {},
      created = () => {},
      started = () => Promise.resolve(),
      events = {},
      publicActions: exposedActions = {},
    }: {
      name: string;
      adapter: any;
      collection: string;
      version?: number;
      hooks?: ServiceHooks;
      created?: () => void;
      started?: () => Promise<void>;
      events?: ServiceEvents;
      publicActions?: Record<string, [ActionParamSchema, ActionHandler]>;
    }
  ) {
    super(broker);
    this.adapter = adapter;

    const publicExposedActions = Object.keys(exposedActions).reduce(
      (acc, key) => {
        acc[`public.${key}`] = {
          cache: false,
          params: exposedActions[key][0],
          handler: exposedActions[key][1],
        };
        return acc;
      },
      {} as Record<string, ServiceActionsSchema>
    );

    this.parseServiceSchema({
      name,
      version,
      mixins: [DbService],
      collection,
      adapter: this.adapter,
      hooks,
      actions: {
        ...updateManyMixin(this),
        ...removeManyMixin(this),
        ...findOneAndUpdateMixin(this),
        ...publicExposedActions,
        ...disableCacheOnDefaultActions(),
      },
      created,
      started,
      events,
    });
  }
}

export const makeOwnershipFromContextMeta = (
  ctx: Context<unknown, ServiceContextMeta>
): Ownership => {
  return {
    buildableId: ctx.meta?.buildable?._id,
    userId: ctx.meta?.user?._id,
    projectId: ctx.meta?.buildable?._id,
    clientId: ctx.meta?.buildable?._id,
    organizationId: ctx.meta?.buildable?._id,
  };
};
