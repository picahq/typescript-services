export const testConnectionModelSchema = {
  connectionDefinitionId: {
    type: 'string',
    empty: false,
  },
  connectionKey: {
    type: 'string',
    empty: false,
  },
  modelName: {
    type: 'string',
    empty: false,
  },
  modelConfig: {
    type: 'object',
    props: {
      updateIdFieldName: {
        type: 'string',
        optional: true,
        default: 'id',
      },
      updateFields: {
        type: 'array',
        optional: true,
        items: {
          type: 'string',
        },
        default: [] as string[],
      },
      getIdFieldName: {
        type: 'string',
        optional: true,
        default: 'id',
      },
      deleteIdFieldName: {
        type: 'string',
        optional: true,
        default: 'id',
      },
      customDeleteValue: {
        type: 'string',
        optional: true,
      },
    },
  },
};
