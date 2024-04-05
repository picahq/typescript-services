export const listSchema = {
  populate: [
    { type: 'string', optional: true },
    { type: 'array', optional: true, items: 'string' },
  ],
  fields: {
    type: 'array',
    optional: true,
    items: 'string',
    default: ['_id', 'key'],
  },
  page: {
    type: 'number',
    integer: true,
    min: 1,
    optional: true,
    convert: true,
    page: 1,
  },
  pageSize: {
    type: 'number',
    integer: true,
    min: 0,
    optional: true,
    convert: true,
    default: 20,
  },
  sort: { type: 'string', optional: true },
  search: { type: 'string', optional: true },
  searchFields: [
    { type: 'string', optional: true },
    { type: 'array', optional: true, items: 'string' },
  ],
  query: {
    type: 'object',
    optional: true,
    default: {
      // deleted: { $or: [{ $exists: false }, { $eq: false }] },
    },
  },
};
