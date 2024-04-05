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
    },
    optional: true,
  },
};
