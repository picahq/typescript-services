'use strict';
require('dotenv').config();

import { Context, Errors } from 'moleculer';
const { MoleculerError } = Errors;

import axios from 'axios';
import { get, omit, pick, uniqBy } from 'lodash';
import DbService from 'moleculer-db';
import MongoDBAdapter from 'moleculer-db-adapter-mongo';

const Auth = require('@libs-private/service-logic/mixins/auth');

import {
  randomCode,
  getFirstAndLastNameFromName,
} from '@libs-private/utils/user';

class AuthGenericError extends MoleculerError {
  constructor() {
    super(
      'Something went wrong during authentication',
      500,
      'authentication-error',
      {}
    );
  }
}

class GithubAuthGenericError extends MoleculerError {
  constructor() {
    super(
      'Something went wrong during Github authentication',
      500,
      'github-authentication-error',
      {}
    );
  }
}

class GitlabAuthGenericError extends MoleculerError {
  constructor() {
    super(
      'Something went wrong during Gitlab authentication',
      500,
      'gitlab-authentication-error',
      {}
    );
  }
}

class OAuthAccountAlreadyAssociated extends MoleculerError {
  constructor() {
    super(
      'This oauth account is already associated with an existing Buildable account.',
      400,
      'oauth-account-already-associated',
      {}
    );
  }
}

class SomethingWentWrong extends MoleculerError {
  constructor() {
    super('Something went wrong', 500, 'something-went-wrong', {});
  }
}

class IncorrectEmailPassword extends MoleculerError {
  constructor() {
    super(
      'The email or password is incorrect',
      400,
      'incorrect-email-password',
      {}
    );
  }
}

const AXIOS_RESPONSE_ERROR = 'Axios Error - Request made and server responded';
const AXIOS_REQUEST_ERROR =
  'Axios Error - Request was made but no response was received';
const AXIOS_REQUEST_SETUP_ERROR =
  'Axios Error - Something happened in setting up the request that triggered an Error';

const ACCESS_KEY_PREFIX_LENGTH = 7;

const RUST_INTERNAL_API_ENDPOINTS = {
  CREATE_EVENT_ACCESS_RECORD: `${process.env.CONNECTIONS_API_BASE_URL}v1/public/event-access/default`,
  GET_EVENT_ACCESS_RECORD: `${process.env.CONNECTIONS_API_BASE_URL}v1/event-access`
};

const generate_default_event_access_record = (
  env: string,
  buildableId: string,
  userId: string
) => {
  return {
    name: `default-${env}-key`.toUpperCase(),
    namespace: 'default',
    group: 'internal-ui',
    connectionType: 'custom',
    platform: 'event-inc',
    environment: env,
    paths: {
      id: '$.body.id',
      event: '$.body.event',
      payload: '$.body.payload',
    },
    ownership: {
      buildableId,
      userId,
      projectId: buildableId,
      organizationId: buildableId,
      clientId: buildableId,
    },
  };
};

module.exports = {
  name: 'users',

  version: 3,

  mixins: [DbService, Auth()],

  collection: 'users',

  adapter: new MongoDBAdapter(
    process.env.MONGO_USERS_URI || process.env.MONGO_URI
  ),

  publicFields: [
    '_id',
    'email',
    'firstName',
    'lastName',
    'createdAt',
    'updatedAt',
    'connectedAccounts',
    'profile',
    'buildableId',
    'state',
    'username',
    'userKey',
    'billing',
    'accessList',
  ],

  actions: {
    getUserFromToken: {
      async handler(ctx: Context) {
        const result = await ctx.broker.call(
          `v${this.version}.${this.name}.get`,
          { id: get(ctx, 'meta.user._id') },
          { meta: ctx.meta }
        );
        return pick(result, this.schema.publicFields);
      },
    },
    deleteUserFromToken: {
      async handler(ctx: any) {
        try {
          const userId = get(ctx, 'meta.user._id');
          await ctx.broker.call(
            `v${this.version}.${this.name}.remove`,
            {
              id: userId
            },
            { meta: ctx.meta }
          );

          return {
            message: 'User deleted successfully'
          };

        }
        catch (error) {
          console.error(error);
          throw new SomethingWentWrong();
        }
      }
    },
    updateUserFromToken: {
      params: {
        firstName: {
          type: 'string',
          optional: true,
        },
        lastName: {
          type: 'string',
          optional: true,
        },
        avatar: {
          type: 'url',
          optional: true,
        },
        state: {
          type: 'enum',
          values: ['completed-onboarding'],
          optional: true,
        },
        role: {
          type: 'string',
          optional: true,
        },
        companyWebsite: {
          type: 'string',
          optional: true,
        },
        companySize: {
          type: 'string',
          optional: true,
        },
        buildingAI: {
          type: 'boolean',
          optional: true,
        },
      },
      async handler(ctx: any) {
        const { firstName, lastName, avatar, state, role, companyWebsite, companySize, buildingAI, ...rest } = ctx.params;

        try {
          const user = await ctx.broker.call(
            `v${this.version}.${this.name}.get`,
            { id: get(ctx, 'meta.user._id') },
            { meta: ctx.meta }
          );

          const profile = Array.isArray(get(user, 'profile'))
            ? { onboardingQuestions: user.profile }
            : user.profile;

          await ctx.broker.call(
            `v${this.version}.${this.name}.update`,
            {
              id: get(ctx, 'meta.user._id'),
              ...(firstName ? { firstName } : {}),
              ...(lastName ? { lastName } : {}),
              profile: {
                ...profile,
                ...omit(rest, 'emails'),
                ...(firstName ? { firstName } : {}),
                ...(lastName ? { lastName } : {}),
                ...(avatar ? { avatar } : {}),
                ...(role ? { role } : {}),
                ...(companyWebsite ? { companyWebsite } : {}),
                ...(companySize ? { companySize } : {}),
                ...(buildingAI ? { buildingAI } : {}),
              },
              ...(state ? { state } : {}),
              ...(state
                ? {
                  stateHistory: [
                    {
                      state,
                      createdAt: Date.now(),
                      createdDate: new Date(),
                    },
                  ].concat(get(user, 'stateHistory') || []),
                }
                : {}),
            },
            { meta: ctx.meta }
          );
        } catch (e) {
          console.error(e);
          throw new SomethingWentWrong();
        }

        return {
          message: 'Successfully updated',
        };
      },
    },
    auth: {
      params: {
        type: 'string',
      },
      async handler(ctx: any) {
        if (ctx.params.type === 'emailPassword') {
          return await ctx.broker.call(
            `v${this.version}.${this.name}.loginWithEmailAndPassword`,
            ctx.params,
            {
              meta: ctx.meta,
            }
          );
        } else {
          return await ctx.broker.call(
            `v${this.version}.${this.name}.oauth`,
            ctx.params,
            { meta: ctx.meta }
          );
        }
      },
    },
    oauth: {
      params: {
        type: {
          type: 'string',
        },
        code: {
          type: 'string',
          convert: true,
        },
      },
      async handler(ctx: any) {
        const { type, code } = ctx.params;

        const map = {
          github: async (code: any) => {
            let accessTokenResult;
            try {
              accessTokenResult = await axios({
                method: 'post',
                url: 'https://github.com/login/oauth/access_token',
                headers: {
                  Accept: 'application/json',
                  'Accept-Encoding': 'UTF-8',
                },
                params: {
                  client_id: ctx.meta.isAdmin
                    ? process.env.ADMIN_GITHUB_OAUTH_CLIENT_ID
                    : process.env.GITHUB_OAUTH_CLIENT_ID,
                  client_secret: ctx.meta.isAdmin
                    ? process.env.ADMIN_GITHUB_OAUTH_CLIENT_SECRET
                    : process.env.GITHUB_OAUTH_CLIENT_SECRET,
                  code,
                },
                decompress: false,
              });
            } catch (error) {
              if (error.response) {
                //shouldn't happen, Github returns 200's even on errors here
                console.error(AXIOS_RESPONSE_ERROR);
                console.error(error.response.data);
                console.error(error.response.status);
                console.error(error.response.headers);
              } else if (error.request) {
                console.error(AXIOS_REQUEST_ERROR);
                console.error(error.request);
              } else {
                console.error(AXIOS_REQUEST_SETUP_ERROR);
                console.error('Error', error.message);
              }

              throw new GithubAuthGenericError();
            }

            if (get(accessTokenResult, 'data.error')) {
              let message =
                `${get(accessTokenResult, 'data.error_description', '')} ${get(
                  accessTokenResult,
                  'data.error_uri',
                  ''
                )}`.trim() ||
                `Error occured calling https://github.com/login/oauth/access_token`;

              throw new MoleculerError(
                message,
                400,
                'github-access-token',
                accessTokenResult.data
              );
            }

            let access_token = get(accessTokenResult, 'data.access_token');

            let user;
            try {
              user = (
                await axios({
                  url: 'https://api.github.com/user',
                  headers: {
                    Authorization: `token ${access_token}`,
                    'Accept-Encoding': 'UTF-8',
                  },
                  decompress: false,
                })
              ).data;
            } catch (error) {
              if (error.response) {
                console.error(AXIOS_RESPONSE_ERROR);
                console.error(error.response.data);
                console.error(error.response.status);
                console.error(error.response.headers);

                throw new MoleculerError(
                  'Error occured trying to retrieve github user info',
                  500,
                  'github-user-retrieval'
                );
              } else if (error.request) {
                console.error(AXIOS_REQUEST_ERROR);
                console.error(error.request);
              } else {
                console.error(AXIOS_REQUEST_SETUP_ERROR);
                console.error('Error', error.message);
              }

              throw new GithubAuthGenericError();
            }

            let emails;
            try {
              emails = (
                await axios({
                  url: 'https://api.github.com/user/emails',
                  headers: {
                    Authorization: `token ${access_token}`,
                    'Accept-Encoding': 'UTF-8',
                  },
                  decompress: false,
                })
              ).data;
            } catch (error) {
              if (error.response) {
                console.error(AXIOS_RESPONSE_ERROR);
                console.error(error.response.data);
                console.error(error.response.status);
                console.error(error.response.headers);

                throw new MoleculerError(
                  'Error occured trying to retrieve github user emails',
                  500,
                  'github-user-emails-retrieval'
                );
              } else if (error.request) {
                console.error(AXIOS_REQUEST_ERROR);
                console.error(error.request);
              } else {
                console.error(AXIOS_REQUEST_SETUP_ERROR);
                console.error('Error', error.message);
              }

              throw new GithubAuthGenericError();
            }

            const email = Array.isArray(emails)
              ? get(
                emails.find((v) => get(v, 'primary')),
                'email'
              )
              : null;

            const username = get(user, 'login');

            const [firstName, lastName] = getFirstAndLastNameFromName(
              get(user, 'name')
            );

            const avatar = get(user, 'avatar_url');

            const profileLink = get(user, 'html_url');

            return {
              user,
              emails,
              email,
              username,
              firstName,
              lastName,
              avatar,
              profileLink,
            };
          },
          gitlab: async (code: any) => {
            let accessTokenResult;
            try {
              accessTokenResult = await axios({
                method: 'post',
                url: 'https://gitlab.com/oauth/token',
                headers: {
                  Accept: 'application/json',
                },
                params: {
                  client_id: process.env.GITLAB_OAUTH_CLIENT_ID,
                  client_secret: process.env.GITLAB_OAUTH_CLIENT_SECRET,
                  code,
                  grant_type: 'authorization_code',
                  redirect_uri: process.env.GITLAB_OAUTH_REDIRECT_URI,
                },
              });
            } catch (error) {
              if (error.response) {
                console.error(AXIOS_RESPONSE_ERROR);
                console.error(error.response.data);
                console.error(error.response.status);
                console.error(error.response.headers);

                const message =
                  get(
                    accessTokenResult,
                    'error.response.data.error_description'
                  ) || `Error occured calling https://gitlab.com/oauth/token`;

                throw new MoleculerError(
                  message,
                  error.response.status,
                  'gitlab-access-token',
                  error.response.data
                );
              } else if (error.request) {
                console.error(AXIOS_REQUEST_ERROR);
                console.error(error.request);
              } else {
                console.error(AXIOS_REQUEST_SETUP_ERROR);
                console.error('Error', error.message);
              }

              throw new GitlabAuthGenericError();
            }

            let access_token = get(accessTokenResult, 'data.access_token');

            let user;
            try {
              user = (
                await axios({
                  url: `https://gitlab.com/api/v4/user?access_token=${access_token}`,
                })
              ).data;
            } catch (error) {
              if (error.response) {
                console.error(AXIOS_RESPONSE_ERROR);
                console.error(error.response.data);
                console.error(error.response.status);
                console.error(error.response.headers);

                throw new MoleculerError(
                  'Error occured trying to retrieve gitlab user info',
                  500,
                  'github-user-retrieval'
                );
              } else if (error.request) {
                console.error(AXIOS_REQUEST_ERROR);
                console.error(error.request);
              } else {
                console.error(AXIOS_REQUEST_SETUP_ERROR);
                console.error('Error', error.message);
              }

              throw new GithubAuthGenericError();
            }

            const email = get(user, 'email');

            const emails = [
              {
                email,
              },
            ];

            const username = get(user, 'username');

            const [firstName, lastName] = getFirstAndLastNameFromName(
              get(user, 'name')
            );

            const avatar = get(user, 'avatar_url');

            return {
              user,
              emails,
              email,
              username,
              firstName,
              lastName,
              avatar,
            };
          },
          default: () => {
            throw new MoleculerError(
              `Auth type '${type}' not supported`,
              400,
              'auth-type-not-supported'
            );
          },
        };

        // @ts-ignore
        const fn = map[type] ? map[type] : map['default'];

        const {
          user,
          emails,
          email,
          username,
          firstName,
          lastName,
          avatar,
          profileLink,
        } = await fn(code);

        if (!email) {
          console.debug(
            `${type} auth data: `,
            JSON.stringify({
              user,
              emails,
              email,
              username,
              firstName,
              lastName,
              avatar,
              profileLink,
            })
          );
          throw new MoleculerError(
            `Unable to retrieve email from ${type}`,
            500,
            `${type}-user-email-retrieval`
          );
        }

        let _user;
        try {
          _user = await this.createOrUpdateUser({
            ctx,
            provider: type,
            user,
            emails,
            email,
            username,
            firstName,
            lastName,
            avatar,
            profileLink,
          });
        } catch (error) {
          console.error(error);
          if (error.type === new OAuthAccountAlreadyAssociated().type) {
            throw error;
          }
          throw new AuthGenericError();
        }

        try {
          const { _id, email, userKey, firstName, lastName, state, pointers } =
            _user;
          // use buildableId in client due to old users having user.buildableId == coreId
          const buildableId = get(_user, 'client.buildableId');
          const containerId = get(_user, 'client.containers[0]._id');

          const token = this.createToken({
            _id,
            email,
            username,
            userKey,
            buildableId,
            containerId,
            firstName,
            lastName,
            pointers,
          });

          return {
            token,
            state,
          };
        } catch (error) {
          console.error(error);
          throw new AuthGenericError();
        }
      },
    },
    loginWithEmailAndPassword: {
      params: {
        email: {
          type: 'email',
        },
        password: {
          type: 'string',
        },
      },
      async handler(ctx: any) {
        const auth = this.auth();
        const { password } = ctx.params;
        let { email } = ctx.params;

        email = email.toLowerCase().trim();

        let user;
        try {
          user = (
            await ctx.broker.call(
              `v${this.version}.${this.name}.find`,
              {
                query: {
                  email,
                },
                pageSize: 1,
              },
              { meta: ctx.meta }
            )
          )[0];
        } catch (e) {
          console.error(e);
          throw new SomethingWentWrong();
        }

        if (!user) {
          throw new IncorrectEmailPassword();
        }

        const isValidPassword = auth.checkPassword(password, user);

        if (!isValidPassword) {
          throw new IncorrectEmailPassword();
        }

        try {
          const {
            _id,
            email,
            username,
            userKey,
            firstName,
            lastName,
            state,
            pointers,
          } = user;
          // use buildableId in client due to old users having user.buildableId == coreId
          const buildableId = get(user, 'client.buildableId');
          const containerId = get(user, 'client.containers[0]._id');

          const token = this.createToken({
            _id,
            email,
            username,
            userKey,
            buildableId,
            containerId,
            firstName,
            lastName,
            pointers,
          });

          return {
            token,
            state,
          };
        } catch (error) {
          console.error(error);
          throw new AuthGenericError();
        }
      },
    },
    mockOauth: {

      params: {
        user: {
          type: 'object',
          props: {
            login: { type: 'string' },
            id: { type: 'number' },
            node_id: { type: 'string' },
            avatar_url: { type: 'string' },
            gravatar_id: { type: 'string' },
            url: { type: 'string' },
            type: { type: 'string' },
            user_view_type: { type: 'string' },
            site_admin: { type: 'boolean' },
            name: { type: 'string' },
          },
        },
        emails: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              email: { type: 'string' },
              primary: { type: 'boolean' },
              verified: { type: 'boolean' },
              visibility: { type: 'string' },
            },
          },
      },
    },

      async handler (ctx: any) {
        try {

          const secretKey = ctx?.meta?.request?.headers?.['x-mock-user-secret-key'];

          if (!secretKey) {
            throw new MoleculerError(
              'The secret key is missing',
              401,
              'unauthorized',
              {}
            );
          }

          if (secretKey !== process.env.MOCK_USER_SECRET_KEY) {
            throw new MoleculerError(
              'The secret key is invalid',
              401,
              'unauthorized',
              {}
            );
          }

          const { user, emails } = ctx.params;

          const email = emails?.[0]?.email;
          const username = user.login;
          const [firstName, lastName] = getFirstAndLastNameFromName(user.name);
          const avatar = user.avatar_url;
          const profileLink = user.url;

          let _user;

          // Create or update user
          try {
            _user = await this.createOrUpdateUser({
              ctx,
              provider: 'mock',
              user,
              emails,
              email,
              username,
              firstName,
              lastName,
              avatar,
              profileLink,
            });
          } catch (error) {
            console.error(error);
            if (error.type === new OAuthAccountAlreadyAssociated().type) {
              throw error;
            }
            throw new AuthGenericError();
          }
        
          // Create token
          try {
            const { _id, email, userKey, firstName, lastName, state, pointers } =
              _user;
            // use buildableId in client due to old users having user.buildableId == coreId
            const buildableId = get(_user, 'client.buildableId');
            const containerId = get(_user, 'client.containers[0]._id');
        
            const token = this.createToken({
              _id,
              email,
              username,
              userKey,
              buildableId,
              containerId,
              firstName,
              lastName,
              pointers,
            });
        
            return {
              token,
              state,
            };
          } catch (error) {
            console.error(error);
            throw new AuthGenericError();
          }


        }
        catch (error) {
          console.error(error);
          throw error;
        }
      }

    },
  },

  methods: {
    async createOrUpdateUser({
      ctx,
      provider,
      user,
      emails,
      email,
      username,
      firstName = '',
      lastName = '',
      avatar = '',
      profileLink = '',
    }: any) {
      const updateUser = async (_user: any) => {
        const profile = get(_user, 'profile');
        const accessList = get(_user, 'accessList');
        const _firstName = get(_user, 'firstName')
          ? get(_user, 'firstName')
          : firstName;
        const _lastName = get(_user, 'lastName')
          ? get(_user, 'lastName')
          : lastName;
        const _avatar = get(_user, 'avatar') ? get(_user, 'avatar') : avatar;
        const connectedAccount = get(_user, 'connectedAccounts', []).find(
          (i: any) => i.email === email && i.provider === provider
        );
        const connectedAccounts = connectedAccount
          ? //ensure old connectedAccount data is updated
          (get(_user, 'connectedAccounts') || []).map((i: any) =>
            i.email === email && i.provider === provider
              ? {
                ...i,
                name: `${firstName} ${lastName}`.trim(),
                email,
                provider,
                username,
                profileLink,
              }
              : i
          )
          : [
            {
              name: `${firstName} ${lastName}`.trim(),
              email,
              provider,
              username,
              profileLink,
              connectedAt: Date.now(),
            },
          ].concat(get(_user, 'connectedAccounts') || []);

        return await ctx.broker.call('v3.users.update', {
          id: _user._id,
          firstName: _firstName,
          lastName: _lastName,
          accessList,
          username: _user.username ? _user.username : username,
          userKey: _user.userKey
            ? _user.userKey
            : `${username || email.substring(0, email.indexOf('@'))
            }${randomCode(6)}`,
          [`providers.${provider}`]: user,
          connectedAccounts,
          profile: {
            //profile may be an array of onboarding questions answered
            ...(Array.isArray(profile)
              ? { onboardingQuestions: profile }
              : profile),
            firstName: _firstName,
            lastName: _lastName,
            avatar: _avatar,
            emails: uniqBy(
              (get(_user, 'profile.emails') || []).concat(
                emails.map((v: any) => ({ ...v, provider }))
              ),
              'email'
            ),
          },
          security: {
            passed: true,
            passedOn: Date.now(),
          },
          updatedAt: Date.now(),
          updatedDate: new Date(),
        });
      };

      const authenticatedEmail = get(ctx, 'meta.user.email');

      if (authenticatedEmail) {
        // this is a connect account attempt
        let authenticatedUser = (
          await ctx.broker.call('v3.users.find', {
            query: { email: authenticatedEmail, isBuildableCore: true },
            pageSize: 1,
          })
        )[0];

        if (!authenticatedUser) {
          //something wrong, should have found - signed token without attached user object in db
          throw new AuthGenericError();
        }

        let connectedUser = (
          await ctx.broker.call('v3.users.find', {
            query: {
              'profile.emails': { $elemMatch: { email } },
              isBuildableCore: true,
            },
            pageSize: 1,
          })
        )[0];

        if (
          connectedUser &&
          get(authenticatedUser, '_id') !== get(connectedUser, '_id')
        ) {
          console.debug(JSON.stringify({ authenticatedUser, connectedUser }));
          throw new OAuthAccountAlreadyAssociated();
        }

        return await updateUser(authenticatedUser);
      } else {
        let _user = (
          await ctx.broker.call('v3.users.find', {
            query: {
              $or: [{ email }, { 'profile.emails': { $elemMatch: { email } } }],
              isBuildableCore: true,
            },
            pageSize: 1,
          })
        )[0];

        if (!_user) {
          _user = await ctx.broker.call('v3.users.create', {
            email,
            username,
            accessList: [],
            userKey: `${username || email.substring(0, email.indexOf('@'))
              }${randomCode(6)}`,
            providers: {
              [provider]: user,
            },
            connectedAccounts: [
              // for frontend connected accounts page
              {
                email,
                username,
                provider,
                profileLink,
                connectedAt: Date.now(),
              },
            ],
            profile: {
              firstName,
              lastName,
              avatar,
              emails: emails.map((v: any) => ({ ...v, provider })),
            },
            state: 'new-user',
            stateHistory: [
              {
                state: 'new-user',
                createdAt: Date.now(),
                createdDate: new Date(),
              },
            ],
            createdAt: Date.now(),
            createdDate: new Date(),
          });

          const client = await ctx.broker.call('v1.clients.create', {
            user: _user,
            name: email,
          });

          // create tmp token for rust api
          const token = this.createToken({
            _id: _user._id,
            email: _user.email,
            username: _user.username,
            userKey: _user.userKey,
            buildableId: client.buildableId,
            containerId: client.containers[0]._id,
            firstName: _user.profile.firstName,
            lastName: _user.profile.lastName,
            pointers: [],
          });

          // Create default API keys
          const createTestKey = axios({
            method: 'post',
            url: RUST_INTERNAL_API_ENDPOINTS.CREATE_EVENT_ACCESS_RECORD,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            data: generate_default_event_access_record(
              'test',
              client.buildableId,
              _user._id
            ),
          });

          const createLiveKey = axios({
            method: 'post',
            url: RUST_INTERNAL_API_ENDPOINTS.CREATE_EVENT_ACCESS_RECORD,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            data: generate_default_event_access_record(
              'live',
              client.buildableId,
              _user._id
            ),
          });

          const keyResults = await Promise.all([createTestKey, createLiveKey]);

          // Extract the access keys from the response and remove the prefix
          const accessKeys = keyResults.map((res) =>
            res.data.accessKey.slice(ACCESS_KEY_PREFIX_LENGTH)
          );

          return await ctx.broker.call('v3.users.update', {
            id: _user._id,
            client,
            buildableId: client.buildableId,
            isBuildableCore: true,
            pointers: accessKeys, // An array of [test, live] access keys without their prefixes
            security: {
              passed: true,
              passedOn: Date.now(),
            },
          });
        } else {
          return await updateUser(_user);
        }
      }
    },
    createToken({
      _id,
      email,
      username,
      userKey,
      buildableId,
      containerId,
      firstName = '',
      lastName = '',
      pointers,
    }: any) {
      const auth = this.auth();

      const token = auth.sign(
        {
          _id: String(_id),
          email,
          username,
          userKey,
          firstName,
          lastName,
          buildableId,
          containerId,
          pointers,
          isBuildableCore: true,
        },
        process.env.JWT_EXPIRES_AFTER,
        buildableId
      );

      return token;
    },
  },
};
