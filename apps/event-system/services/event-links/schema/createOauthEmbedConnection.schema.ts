export const createOauthEmbedConnectionSchema = {
  connectionDefinitionId: {
    type: 'string',
  },
  linkToken: {
    type: 'string',
  },
  type: {
    type: 'string',
  },
  code: {
    type: 'string',
  },
  redirectUri: {
    type: 'string',
  },
  clientId: {
    type: 'string',
  },
  formData: {
    type: 'object',
    optional: true,
  },
};
