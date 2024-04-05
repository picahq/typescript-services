'use strict';
require('dotenv').config();

import { Service, ServiceBroker, Context, Errors } from 'moleculer';
const { MoleculerError } = Errors;
import DbConnection from '@libs-private/db-management/db.mixin';
import {
  EventAccessKey,
  EventAccessWithIdentifiers,
  EventAccessWithSecrets,
} from '@libs-private/db-management/types/eventAccess';

export class MaximumAPIKeysReachedError extends MoleculerError {
  constructor() {
    super(
      'You have reached the maximum number of API Keys that can be created.',
      400,
      'maximum-api-keys-reached',
      {}
    );
  }
}

export class SecretNotFoundError extends MoleculerError {
  constructor() {
    super('Secret not found.', 404, 'secret-not-found', {});
  }
}

export class NoSignatureFoundError extends MoleculerError {
  constructor() {
    super('No signature found to verify.', 404, 'no-signature-found', {});
  }
}

export class UnauthorizedError extends MoleculerError {
  constructor(data?: any) {
    super('Unauthorized', 401, 'unauthorized', data || {});
  }
}

export class ParametersValidationError extends MoleculerError {
  constructor(data: any) {
    super('Invalid parameters', 422, 'invalid-parameters', data);
  }
}

export class NotFoundError extends MoleculerError {
  constructor() {
    super('Not Found', 404, 'not-found', {});
  }
}

const SERVICE_CONFIG: {
  name: string;
  collectionName: string;
  version: number;
} = {
  name: 'event-access',
  collectionName: 'event-access',
  version: 1,
};

export interface VerifyWebhookSignatureProps {
  request: {
    headers: object;
    body: string;
  };
  signature: string;
  secret: string | null;
  webhookUrl?: string;
  webhookId?: string;
  webhookIds?: string[];
}

export default class EventAccessService extends Service {
  private DbMixin = new DbConnection(SERVICE_CONFIG.collectionName).start();

  public constructor(public broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: SERVICE_CONFIG.name,

      version: SERVICE_CONFIG.version,

      settings: {
        idField: '_id',
      },

      mixins: [this.DbMixin],

      hooks: {
        after: {
          '*': async (ctx, data) => {
            if (ctx.action.name === 'v1.event-access.update') {
              await ctx.broker.broadcast('cache.clean.event-access', {
                eventAccess: data,
              });
            }

            return data;
          },
        },
      },

      actions: {
        /**
         * Verify Secret
         *
         * @description - Verifies a secret for an SDK
         *
         * @param {EventAccessKey} secret - Secret key to verify
         *
         * @returns {Promise<EventAccessWithSecrets>} - Event access record
         */
        'verify.secret': {
          cache: {
            enabled: true,
            ttl: 3600,
            keys: ['#buildable._id', 'secret'],
          },
          params: {
            secret: {
              type: 'string',
              empty: false,
            },
          },
          async handler(
            ctx: Context<
              {
                secret: EventAccessKey;
              },
              {
                buildable: any;
                user: any;
                ownership: any;
              }
            >
          ): Promise<EventAccessWithSecrets> {
            const { secret } = ctx.params;

            const eventAccessWithSecret: EventAccessWithSecrets = (
              await this.adapter.collection
                .find({
                  accessKey: secret,
                  deleted: false,
                })
                .project({
                  _id: 1,
                  _v: 1,
                  name: 1,
                  namespace: 1,
                  type: 1,
                  group: 1,
                  paths: 1,
                  ownership: 1,
                  environment: 1,
                  active: 1,
                  createdAt: 1,
                  createdDate: 1,
                })
                .limit(1)
                .toArray()
            )[0];

            if (!eventAccessWithSecret) throw new NotFoundError();

            return eventAccessWithSecret;
          },
        },

        /**
         * Verify Signature
         *
         * @description - Verifies an event payload signature
         *
         * @param {VerifyWebhookSignatureProps} payload - Payload passed to IntegrationHandler to verify
         * @param {string} type - Integration type
         * @param {Any} secret - Secret used in verification
         *
         * @returns {Promise<Boolean>} - Whether the IntegrationHandler verified the payload
         */
        'verify.signature': {
          params: {
            payload: {
              type: 'object',
              empty: false,
            },
            type: {
              type: 'string',
              empty: false,
            },
            secret: {
              type: 'any',
              empty: false,
            },
          },
          async handler(
            ctx: Context<
              {
                payload: VerifyWebhookSignatureProps;
                type: string;
                secret: any;
              },
              {
                buildable: any;
                user: any;
                ownership: any;
              }
            >
          ): Promise<Boolean> {
            const { payload, type, secret } = ctx.params;

            const meta = {
              meta: ctx.meta,
            };

            const IntegrationHandler: any = await ctx.broker.call(
              'v1.integrations.get.integration.class',
              {
                type,
              },
              meta
            );

            const Integration = new IntegrationHandler(secret);

            try {
              await Integration.verifyWebhookSignature(payload);

              return true;
            } catch (e) {
              return false;
            }
          },
        },

        /**
         * Verify
         *
         * @description - Verifies by calling verify.secret or verify.identifier
         *
         * @param {EventAccessKey} secret - Secret key to verify
         * @param {EventAccessKey} identifier - Identifier key to verify
         * @param {Object} headers - Event request headers
         * @param {Any} body - Event request body
         *
         * @returns {Promise<EventAccessWithIdentifiers | EventAccessWithSecrets>} - Event access record
         */
        verify: {
          params: {
            secret: {
              type: 'string',
              empty: false,
              optional: true,
            },
            identifier: {
              type: 'string',
              empty: false,
              optional: true,
            },
            headers: {
              type: 'object',
              empty: false,
              optional: true,
            },
            body: {
              type: 'any',
              empty: false,
              optional: true,
            },
            query: {
              type: 'object',
              optional: true,
              default: {},
            },
          },
          async handler(
            ctx: Context<
              {
                secret?: string;
                identifier?: string;
                headers?: object;
                body?: any;
                query: object;
              },
              {
                buildable: any;
                user: any;
                ownership: any;
              }
            >
          ): Promise<EventAccessWithIdentifiers | EventAccessWithSecrets> {
            const { identifier, secret, headers, body, query } = ctx.params;

            const meta = {
              meta: ctx.meta,
            };

            if (!secret && !identifier) {
              throw new ParametersValidationError({
                message: 'No identifier or secret provided.',
              });
            }

            if (secret && identifier) {
              throw new ParametersValidationError({
                message: 'Cannot provide both an identifier and secret.',
              });
            }

            if (secret) {
              const result = await ctx.call(
                'v1.event-access.verify.secret',
                { secret },
                meta
              );

              return result as EventAccessWithSecrets;
            }
          },
        },
      },

      events: {},

      methods: {},

      async started() {},

      async stopped() {},
    });
  }
}
