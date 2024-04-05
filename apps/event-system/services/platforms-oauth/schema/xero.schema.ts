export const xeroOauthInitSchema = {
  metadata: {
    type: 'object',
    optional: true,
    props: {
      code: {
        type: 'string',
      },
      redirectUri: {
        type: 'string',
      },
    },
  },
  clientId: {
    type: 'string',
  },
  clientSecret: {
    type: 'string',
  },
};

export const xeroOauthRefreshSchema = {
  OAUTH_CLIENT_ID: {
    type: 'string',
    optional: true,
  },
  OAUTH_CLIENT_SECRET: {
    type: 'string',
    optional: true,
  },
  OAUTH_ACCESS_TOKEN: {
    type: 'string',
    optional: true,
  },
  OAUTH_REFRESH_TOKEN: {
    type: 'string',
    optional: true,
  },
  OAUTH_EXPIRES_IN: {
    type: 'number',
    optional: true,
  },
  OAUTH_METADATA: {
    type: 'object',
    optional: true,
    props: {
      accessToken: {
        type: 'string',
      },
      refreshToken: {
        type: 'string',
      },
      expiresIn: {
        type: 'number',
      },
      tokenType: {
        type: 'string',
      },
      clientId: {
        type: 'string',
      },
      clientSecret: {
        type: 'string',
      },
      metadata: {
        type: 'object',
        props: {
          tenantId: {
            type: 'string',
          },
        },
      },
    },
  },
  OAUTH_REQUEST_PAYLOAD: {
    type: 'object',
    optional: true,
  },
};
