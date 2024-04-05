import { createSchema } from '@libs-private/generic-schema/create.schema';

export const createSettingsSchema = {
  ...createSchema,
  platform: {
    type: 'object',
    props: {
      connectionDefinitionId: {
        type: 'string',
      },
      type: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      active: {
        type: 'boolean',
        default: true,
      },
      image: {
        type: 'string',
      },
      activatedAt: {
        type: 'number',
        default: new Date().getTime(),
      },
    },
  },
  configuration: {
    type: 'object',
    optional: true,
    props: {
      CLIENT_ID: {
        type: 'string',
      },
      CLIENT_SECRET: {
        type: 'string',
      },
    },
  },
};
