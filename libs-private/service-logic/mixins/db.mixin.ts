'use strict';
const path = require('path');
const mkdir = require('mkdirp').sync;
import DbService from 'moleculer-db';

module.exports = function (collection: string, dbUrl = process.env.MONGO_URI) {
  if (process.env.MONGO_URI) {
    // Mongo adapter
    const MongoAdapter = require('moleculer-db-adapter-mongo');
    return {
      mixins: [DbService],
      adapter: new MongoAdapter(dbUrl),
      collection,
    };
  }
  // Create data folder
  mkdir(path.resolve('./data'));
  return {
    mixins: [DbService],
    adapter: new DbService.MemoryAdapter({
      filename: `./data/${collection}.db`,
    }),
    actions: {
      list: {
        cache: false,
      },
      find: {
        cache: false,
      },
      get: {
        cache: false,
      },
      update: {
        cache: false,
      },
      create: {
        cache: false,
      },
      remove: {
        cache: false,
      },
    },
    methods: {
      entityChanged(type: any, json: any, ctx: any) {
        return this.clearCache().then(() => {
          const eventName = `${this.name}.entity.${type}`;
          this.broker.emit(eventName, { meta: ctx.meta, entity: json });
        });
      },
    },
  };
};
