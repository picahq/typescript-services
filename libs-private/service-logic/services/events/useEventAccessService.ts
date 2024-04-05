import { omit, groupBy } from 'lodash';
import { Context } from 'moleculer';
import {
  EnvironmentTypes,
  EventAccessBase,
  EventAccessWithSecrets,
  FindRequest,
  ListRequest,
  ListResponse,
  Ownership,
  Services,
} from '@libs-private/data-models';
import {
  EventAccessCreateSecretPayload,
  EventAccessInformation,
  EventAccessKeyInformation,
  EventAccessVerify,
  EventAccessVerifyIdentifier,
  EventAccessVerifyIdentifierService,
  EventAccessVerifySecretPayload,
  VerifyViaEncryptionResponse,
} from '@libs-private/data-models/types/events/event-access';
import { BResult } from '@event-inc/types/results';
import { EventAccessPolicyGenerator } from '../../../policies/eventAccess';
import { buildableSlugify } from '../../../utils/ids';
import { generateMeta } from '../../../utils/meta';
import { resultErr, resultOk } from '@event-inc/utils/result';
import { validateEventAccessKey } from '../../../utils/security';
import { generateEventAccessWithSecrets } from '../../generators/events/eventAccess';
import { useGenericCRUDService } from '../genericCRUD';
import {
  ensureBothEnvironmentsFound,
  getPathsFromEventAccessKeyData,
  getSecretInformation,
  handleSecretRedaction,
  producePartialTopicFromEventAccessKeyData,
} from './helpers';
import { ValidAccessKey } from '@event-inc/types';

const SERVICE_NAME = Services.EventAccess;
const SERVICE_NAME_V1 = Services.EventAccessV1;

export const useEventAccessService = (ctx: Context, ownership: Ownership) => {
  const { insert, count, remove, find, list, get, updateMany } =
    useGenericCRUDService(ctx, SERVICE_NAME, ownership);

  const meta = generateMeta(ownership);

  const { handleMaximumAllowedSecretKeys } = EventAccessPolicyGenerator(
    ctx,
    ownership
  );

  return {
    remove,

    async createSecret({
      name,
      type = 'custom',
      group,
    }: EventAccessCreateSecretPayload): Promise<
      BResult<EventAccessInformation, 'service', unknown>
    > {
      group = group || buildableSlugify(name);

      const createdSecretCountResult = await count({
        query: {
          secret: {
            $exists: true,
          },
          deleted: false,
          ownership,
        },
      });

      const createdSecretCount = createdSecretCountResult.unwrap();

      await handleMaximumAllowedSecretKeys(createdSecretCount);

      const eventAccessRecords = ['test', 'live'].map(
        (environment: EnvironmentTypes) =>
          generateEventAccessWithSecrets({
            name,
            type,
            group,
            environment,
            ownership,
          })
      );

      const insertResult = await insert('evt_ac', eventAccessRecords);

      const insertResultData = insertResult.unwrap();

      const secretKeyInformation = getSecretInformation(
        insertResultData.find((item) => item.environment === 'test'),
        insertResultData.find((item) => item.environment === 'live')
      );

      return resultOk(secretKeyInformation);
    },

    async verifySecret({
      secret,
    }: EventAccessVerifySecretPayload): Promise<
      BResult<Partial<EventAccessWithSecrets>, 'service', unknown>
    > {
      const eventAccessRecordResult = await find<
        Partial<EventAccessWithSecrets>
      >({
        query: {
          secret,
        },
        fields: [
          '_id',
          '_v',
          'name',
          'namespace',
          'type',
          'group',
          'paths',
          'ownership',
          'environment',
          'active',
          'createdAt',
          'createdDate',
        ],
      });

      const eventAccessRecord: Partial<EventAccessWithSecrets> =
        eventAccessRecordResult.unwrap()[0];

      return resultOk(eventAccessRecord);
    },

    async listRedactedSecrets({
      query = {
        type: 'custom',
        secret: {
          $exists: true,
        },
        deleted: false,
        active: true,
      },
      page = 1,
      pageSize = 25,
      sort,
      populate,
      fields = ['_id', 'name', 'secret', 'environment', 'createdAt'],
      redacted = true,
    }: ListRequest & { redacted?: boolean }): Promise<
      BResult<ListResponse<EventAccessInformation>, 'service', unknown>
    > {
      const eventAccessRecordResult = await list<EventAccessWithSecrets>({
        query: {
          ...query,
          type: 'custom',
          secret: {
            $exists: true,
          },
          active: true,
          deleted: false,
        },
        page,
        pageSize,
        sort,
        populate,
        fields,
      });

      const eventAccessRecords: ListResponse<EventAccessWithSecrets> =
        eventAccessRecordResult.unwrap();

      const redactedEventAccessRecords = handleSecretRedaction(
        redacted,
        eventAccessRecords
      );

      const groupedSecrets = groupBy(
        redactedEventAccessRecords.rows,
        (secret) => secret
      );

      const secretInformationList: ListResponse<EventAccessInformation> = {
        ...omit(redactedEventAccessRecords, ['rows']),
        rows: [],
      };

      secretInformationList.rows = Object.values(groupedSecrets).map(
        (key: EventAccessWithSecrets[]) =>
          getSecretInformation(
            key.find((item) => item.environment === 'test'),
            key.find((item) => item.environment === 'live')
          )
      );

      return resultOk(secretInformationList);
    },

    async listAccessKeys({
      query = {
        type: 'custom',
        accessKey: {
          $exists: true,
        },
        deleted: false,
        active: true,
      },
      page = 1,
      pageSize = 25,
      sort,
      populate,
      fields = ['_id', 'name', 'accessKey', 'environment', 'createdAt'],
    }: ListRequest & { redacted?: boolean }): Promise<
      BResult<ListResponse<EventAccessKeyInformation>, 'service', unknown>
    > {
      const eventAccessRecordResult = await list<EventAccessKeyInformation>({
        query: {
          ...query,
          type: 'custom',
          accessKey: {
            $exists: true,
          },
          active: true,
          deleted: false,
        },
        page,
        pageSize,
        sort,
        populate,
        fields,
      });

      const eventAccessRecords: ListResponse<EventAccessKeyInformation> =
        eventAccessRecordResult.unwrap();

      return resultOk(eventAccessRecords);
    },

    async getSecret({
      id,
      fields,
    }: Pick<FindRequest, 'fields'> & { id: string }): Promise<
      BResult<
        {
          secret: ValidAccessKey;
        },
        'service',
        unknown
      >
    > {
      const eventAccessRecordResult = await get<EventAccessWithSecrets>(id, {
        fields,
        query: {
          deleted: false,
        },
      });

      const eventAccessRecord: EventAccessWithSecrets =
        eventAccessRecordResult.unwrap();

      return resultOk({
        secret: eventAccessRecord.secret,
      });
    },

    async deleteSecret({ name }: { name: string }): Promise<
      BResult<
        {
          success: boolean;
        },
        'service',
        unknown
      >
    > {
      const eventAccessRecordResult = await find<
        Pick<EventAccessWithSecrets, '_id' | 'environment'>
      >({
        query: {
          name,
          deleted: false,
        },
        fields: ['_id', 'environment'],
      });

      const eventAccessRecords = eventAccessRecordResult.unwrap();

      ensureBothEnvironmentsFound(eventAccessRecords);

      const updateManyResult = await updateMany({
        query: {
          name,
        },
        update: {
          $set: {
            deleted: true,
          },
        },
      });

      updateManyResult.unwrap();

      return resultOk({
        success: true,
      });
    },

    async verifyViaEncryption({
      secret,
    }: {
      secret: ValidAccessKey;
    }): Promise<BResult<VerifyViaEncryptionResponse, 'service', unknown>> {
      const verifyAccessKeyResult = validateEventAccessKey(
        secret,
        process.env.EVENT_ACCESS_ENCRYPTION_PASSWORD
      );

      const verifiedAccessKeyDataResult = verifyAccessKeyResult;

      return verifiedAccessKeyDataResult.map((verifiedAccessKeyData) => ({
        topicPrefix: producePartialTopicFromEventAccessKeyData(
          verifiedAccessKeyData
        ),
        paths: getPathsFromEventAccessKeyData(verifiedAccessKeyData),
      }));

      // return resultOk({
      // 	topicPrefix: producePartialTopicFromEventAccessKeyData(
      // 		verifiedAccessKeyData
      // 	),
      // 	paths: getPathsFromEventAccessKeyData(verifiedAccessKeyData),
      // });
    },

    async verifyViaIdentifier({
      event,
      headers,
      body,
      secretOrIdentifier: identifier,
    }: EventAccessVerifyIdentifier): Promise<
      BResult<EventAccessBase, 'service', unknown>
    > {
      const fullActionName = `${SERVICE_NAME_V1}.verify`;

      try {
        const eventAccessRecord = await ctx.broker.call<
          EventAccessBase,
          EventAccessVerifyIdentifierService
        >(
          fullActionName,
          {
            event,
            headers,
            body,
            identifier,
          },
          meta
        );
        return resultOk(eventAccessRecord);
      } catch (e) {
        const panicAndRetry =
          e.type === ('not-found' || e.message.toLowerCase() === 'unauthorized')
            ? false
            : true;

        return resultErr<'service'>(
          panicAndRetry ? 'PANIC' : false,
          e.code === 404 ? 'service_4004' : 'service_4000',
          e.message || 'Error while verifying event access',
          'buildable-core',
          panicAndRetry,
          {
            incoming: [fullActionName, { identifier, headers }],
            serviceData: e.data,
          }
        );
      }
    },

    async verifyViaSecret({
      event,
      headers,
      payload,
      secret,
    }: EventAccessVerify): Promise<
      BResult<EventAccessBase, 'service', unknown>
    > {
      const fullActionName = `${SERVICE_NAME_V1}.verify`;

      try {
        const eventAccessRecord = await ctx.broker.call<
          EventAccessBase,
          EventAccessVerify
        >(
          fullActionName,
          {
            event,
            headers,
            payload,
            secret,
          },
          meta
        );
        return resultOk(eventAccessRecord);
      } catch (e) {
        return resultErr<'service'>(
          e.type === 'not-found' ? 'PANIC' : false,
          e.code === 404 ? 'service_4004' : 'service_4000',
          e.message || 'Error while verifying event access',
          'buildable-core',
          e.type === 'not-found' ? false : true,
          {
            incoming: [fullActionName, { secret, headers }],
            serviceData: e.data,
          }
        );
      }
    },
  };
};
