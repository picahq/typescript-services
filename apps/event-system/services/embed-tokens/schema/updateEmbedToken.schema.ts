export const updateEmbedTokenSchema = {
  sessionId: {
    type: 'string',
  },
  formData: {
    type: 'object',
    optional: true,
  },
  response: {
    type: 'object',
    props: {
      isConnected: {
        type: 'boolean',
      },
      message: {
        type: 'string',
        optional: true,
      },
      connection: {
        type: 'object',
        optional: true,
      },
    },
    optional: true,
  },
};
