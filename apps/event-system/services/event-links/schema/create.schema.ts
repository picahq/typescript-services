import { createSchema } from '@libs-private/generic-schema/create.schema';

export const createLinkSchema = {
  ...createSchema,
  label: {
    type: 'string',
    optional: true,
  },
  group: {
    type: 'string',
    optional: true,
  },
  ttl: {
    type: 'number',
    default: 2 * 1000 * 60 * 60, // 2 hours
  },
};
