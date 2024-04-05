const BlacklistDbService = require('../../../../libs-private/service-logic/mixins/db.mixin');

const serviceConfigs = {
  name: 'blacklist',
  module: 'blacklist',
  version: 1,
  businessSettings: {},
};

let blacklist: any = {};

module.exports = {
  name: serviceConfigs.name,

  version: serviceConfigs.version,

  mixins: [BlacklistDbService(serviceConfigs.name, process.env.MONGO_URI)],

  settings: {},

  hooks: {},

  actions: {
    // override default mixin actions
    find: false,
    count: false,
    list: false,
    create: false,
    insert: false,
    get: false,
    update: false,
    remove: false,

    delete: {
      params: {
        query: {
          type: 'any',
        },
      },
      async handler(ctx: any) {
        const { query } = ctx.params;

        const allowedEnvironments = ['test'];
        if (!allowedEnvironments.includes(process.env.NODE_ENV)) {
          throw new Error(
            `Removing blacklist entries is only allowed in ${allowedEnvironments.join(
              ', '
            )}`
          );
        }

        return await this.adapter.db
          .collection(serviceConfigs.name)
          .deleteMany(query);
      },
    },

    block: {
      params: {
        keys: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              key: 'string',
              type: 'string',
            },
          },
        },
      },
      async handler(ctx: any) {
        const { keys } = ctx.params;

        return Promise.all(
          keys.map(async ({ key, type }: any) => {
            const data = {
              key,
              type,
              enabled: true,
              createdAt: Date.now(),
            };

            const insertedData = await this.adapter.insert(data);

            ctx.broker.broadcast('blacklist.blocked', { key, type });

            return insertedData;
          })
        );
      },
    },

    unblock: {
      params: {
        keys: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      async handler(ctx: any) {
        const { keys } = ctx.params;

        return Promise.all(
          keys.map(async (key: any) => {
            const updatedData = await this.adapter.db
              .collection(serviceConfigs.name)
              .updateOne(
                { key },
                { $set: { enabled: false, updatedAt: Date.now() } },
                {}
              );

            ctx.broker.broadcast('blacklist.unblocked', { key });

            return updatedData;
          })
        );
      },
    },

    check: {
      params: {
        keys: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      async handler(ctx: any) {
        const { keys } = ctx.params;

        for (let key of keys) {
          // @ts-ignore
          const enabled = blacklist[key];
          if (enabled) {
            return {
              enabled: true,
            };
          }
        }

        return {
          enabled: false,
        };
      },
    },
  },

  methods: {
    async refresh(ctx: any) {
      const data = await this.adapter.db
        .collection(serviceConfigs.name)
        .aggregate([
          { $match: { enabled: true } },
          { $project: { key: 1, _id: 0 } },
          { $limit: 3000 }, // important! otherwise large data pull can cause db/node to crash. Need to monitor how many records we create till this limit is reached.
          { $group: { _id: 1, blocked: { $addToSet: { k: '$key', v: 1 } } } },
          { $project: { _id: 0, result: { $arrayToObject: '$blocked' } } },
          { $replaceRoot: { newRoot: '$result' } },
        ])
        .toArray();

      blacklist = data[0] || {};
    },
  },

  events: {
    'blacklist.blocked': {
      async handler(ctx: any) {
        const { key } = ctx.params;

        blacklist[key] = true;
      },
    },
    'blacklist.unblocked': {
      async handler(ctx: any) {
        const { key } = ctx.params;

        if (blacklist[key]) {
          delete blacklist[key];
        }
      },
    },
    'blacklist.refresh': {
      async handler(ctx: any) {
        await this.refresh();
      },
    },
  },

  async started(broker: any) {
    await this.refresh();
  },
};
