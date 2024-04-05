import {
  FindRequest,
  IdPrefix,
  ListRequest,
  ListResponse,
  Ownership,
  ServiceName,
  WithCreate,
  WithId,
  ExtendedMongoError,
} from '@libs-private/data-models';
import { Rename } from '@event-inc/types';
import { Context } from 'moleculer';
import { getCreatedFields, getUpdatedFields } from '../../utils';
import { generateId } from '@integrationos/rust-utils';
import {
  UpdateManyModel,
  DeleteManyModel,
  UpdateFilter,
  FindOneAndUpdateOptions,
  Filter,
  MongoError,
  MongoDriverError,
  MongoServerError,
} from 'mongodb';
import { BResult } from '@event-inc/types/results';
import { resultErr, resultOk } from '@event-inc/utils/result';

const addOwnershipToQuery = (
  query: Record<string, unknown>,
  ownership: Ownership,
  enabled = true
) =>
  enabled
    ? {
        ...query,
        'ownership.buildableId': ownership.buildableId,
      }
    : query;

const handleReturningOnDuplicate = async <T>(
  ctx: Context,
  service: ServiceName,
  ownership: Ownership,
  error: MongoError | MongoDriverError | MongoServerError,
  meta?: unknown
): Promise<BResult<T & WithCreate & WithId & Ownership, 'service'>> => {
  const DUPLICATE_KEY_ERROR_CODE = 11000;

  // Handle mongoError E11000: find the duplicate key, find the record and return it
  if (error.code === DUPLICATE_KEY_ERROR_CODE) {
    const extendedMongoError = error as ExtendedMongoError;
    const duplicateQuery = extendedMongoError.keyValue;

    const duplicateRecord: (T & WithCreate & WithId & Ownership)[] =
      await ctx.broker.call(
        `${service}.find`,
        {
          query: addOwnershipToQuery(duplicateQuery, ownership),
        },
        { meta }
      );
    return resultOk(duplicateRecord[0]);
  }
};

export const useGenericCRUDService = (
  ctx: Context,
  service: ServiceName,
  ownership: Ownership,
  {
    DISABLE_ADDING_OWNERSHIP_CHECK = false,
    RETURN_ON_DUPLICATE = false,
    ENABLE_SOFT_DELETE = false,
  } = {}
) => {
  const updateById = async <T = Record<string, unknown>>(
    id: string,
    data: T
  ): Promise<BResult<number, 'service'>> => {
    const fullActionName = `${service}.updateMany`;
    const updatedFields = getUpdatedFields();
    try {
      const result: number = await ctx.broker.call(fullActionName, {
        query: {
          ...addOwnershipToQuery(
            { _id: id },
            ownership,
            !DISABLE_ADDING_OWNERSHIP_CHECK
          ),
          ...(ENABLE_SOFT_DELETE ? { deleted: { $ne: true } } : {}),
        },
        update: {
          $set: { ...data, ...updatedFields },
        },
      });
      return resultOk(result);
    } catch (error) {
      return resultErr<'service'>(
        false,
        'service_4000',
        error.message,
        'buildable-core',
        typeof error.retryable === 'boolean' ? error.retryable : true,
        error.data
      );
    }
  };

  const updateMany = async (
    props: Rename<UpdateManyModel, 'filter', 'query'>
  ): Promise<BResult<number, 'service'>> => {
    const fullActionName = `${service}.updateMany`;
    const updatedFields = getUpdatedFields();
    let _update: UpdateFilter<unknown> = props.update as UpdateFilter<unknown>;
    if (Object.keys(props.update).includes('$set')) {
      _update = {
        $set: { ..._update['$set'], ...updatedFields },
      };
    } else {
      _update = {
        $set: { ...props.update, ...updatedFields },
      };
    }

    try {
      const result: number = await ctx.broker.call(fullActionName, {
        ...props,
        query: {
          ...addOwnershipToQuery(
            props.query,
            ownership,
            !DISABLE_ADDING_OWNERSHIP_CHECK
          ),
          ...(ENABLE_SOFT_DELETE ? { deleted: { $ne: true } } : {}),
        },
        update: {
          ...props.update,
          ..._update,
        },
      });
      return resultOk(result);
    } catch (error) {
      return resultErr<'service'>(
        false,
        'service_4000',
        error.message,
        'buildable-core',
        typeof error.retryable === 'boolean' ? error.retryable : true,
        error.data
      );
    }
  };

  return {
    async create<T>(
      prefix: IdPrefix,
      data: Omit<T, keyof WithCreate | keyof WithId | 'ownership'>,
      meta?: unknown
    ): Promise<BResult<T & WithCreate & WithId & Ownership, 'service'>> {
      const _id = generateId(prefix);
      const fullActionName = `${service}.create`;
      const createFields = getCreatedFields();
      try {
        const result: T & WithCreate & WithId & Ownership =
          await ctx.broker.call(
            fullActionName,
            {
              _id,
              ...data,
              ...createFields,
              ownership,
            },
            { meta }
          );
        return resultOk(result);
      } catch (error) {
        if (RETURN_ON_DUPLICATE) {
          return await handleReturningOnDuplicate<T>(
            ctx,
            service,
            ownership,
            error,
            meta
          );
        }

        return resultErr<'service'>(
          false,
          'service_4000',
          error.message,
          'buildable-core',
          typeof error.retryable === 'boolean' ? error.retryable : true,
          {
            cause: error.cause,
            connectionGeneration: error.connectionGeneration,
            stack: error.stack,
            ...error,
          }
        );
      }
    },
    // Allows you to insert one or many records
    async insert<T>(
      prefix: IdPrefix,
      data: T | T[],
      meta?: unknown
    ): Promise<BResult<T[], 'service'>> {
      const fullActionName = `${service}.insert`;
      const createFields = getCreatedFields();

      try {
        if (!Array.isArray(data)) {
          data = [data];
        }

        const populatedData = data.map((item) => ({
          _id: generateId(prefix),
          ...item,
          ...createFields,
          ownership,
        }));

        const result: T[] = await ctx.broker.call(
          fullActionName,
          { entities: populatedData },
          { meta }
        );

        return resultOk(result);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          error.message,
          'buildable-core',
          typeof error.retryable === 'boolean' ? error.retryable : true,
          error.data
        );
      }
    },
    async createWithoutId<T>(
      data: Omit<T, keyof WithCreate>,
      meta?: unknown
    ): Promise<BResult<T & WithCreate & WithId, 'service'>> {
      const fullActionName = `${service}.create`;
      const createFields = getCreatedFields();
      try {
        const result: T & WithCreate & WithId = await ctx.broker.call(
          fullActionName,
          {
            ...data,
            ...createFields,
            ownership,
          },
          { meta }
        );
        return resultOk(result);
      } catch (error) {
        if (RETURN_ON_DUPLICATE) {
          return await handleReturningOnDuplicate<T>(
            ctx,
            service,
            ownership,
            error,
            meta
          );
        }

        return resultErr<'service'>(
          false,
          'service_4000',
          error.message,
          'buildable-core',
          typeof error.retryable === 'boolean' ? error.retryable : true,
          {
            cause: error.cause,
            connectionGeneration: error.connectionGeneration,
            stack: error.stack,
            ...error,
          }
        );
      }
    },
    async list<T>(
      props: ListRequest = {}
    ): Promise<BResult<ListResponse<T>, 'service'>> {
      const { query, ...rest } = props;
      const fullActionName = `${service}.list`;
      try {
        const results: ListResponse<T> = await ctx.broker.call(fullActionName, {
          ...rest,
          query: {
            ...addOwnershipToQuery(
              query,
              ownership,
              !DISABLE_ADDING_OWNERSHIP_CHECK
            ),
            ...(ENABLE_SOFT_DELETE ? { deleted: { $ne: true } } : {}),
          },
        });
        return resultOk(results);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          error.message,
          'buildable-core',
          typeof error.retryable === 'boolean' ? error.retryable : true,
          error.data
        );
      }
    },
    async find<T>(props: FindRequest = {}): Promise<BResult<T[], 'service'>> {
      const { query = {}, ...rest } = props;
      const fullActionName = `${service}.find`;

      try {
        const results: T[] = await ctx.broker.call(fullActionName, {
          ...rest,
          query: {
            ...addOwnershipToQuery(
              query,
              ownership,
              !DISABLE_ADDING_OWNERSHIP_CHECK
            ),
            ...(ENABLE_SOFT_DELETE ? { deleted: { $ne: true } } : {}),
          },
        });
        return resultOk(results);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          error.message,
          'buildable-core',
          typeof error.retryable === 'boolean' ? error.retryable : true,
          error.data
        );
      }
    },
    async get<T>(
      id: string,
      props: Pick<FindRequest, 'fields' | 'query'> = {}
    ): Promise<BResult<T, 'service'>> {
      const fullActionName = `${service}.find`;
      try {
        const result: T[] =
          (await ctx.broker.call(fullActionName, {
            ...props,
            query: {
              ...addOwnershipToQuery(
                { _id: id },
                ownership,
                !DISABLE_ADDING_OWNERSHIP_CHECK
              ),
              ...(ENABLE_SOFT_DELETE ? { deleted: { $ne: true } } : {}),
            },
          })) || [];

        if (result.length === 0) {
          return resultErr<'service'>(
            false,
            'service_4004',
            'Not found',
            'buildable-core',
            false
          );
        }

        return resultOk(result[0]);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          error.message,
          'buildable-core',
          typeof error.retryable === 'boolean' ? error.retryable : true,
          error.data
        );
      }
    },
    updateById,
    updateMany,
    async findAndUpdate<T = Record<string, unknown>>({
      query,
      update,
      options,
    }: {
      query: Filter<unknown>;
      update: UpdateFilter<unknown>;
      options?: FindOneAndUpdateOptions;
    }): Promise<BResult<T, 'service'>> {
      const fullActionName = `${service}.findOneAndUpdate`;
      const updatedFields = getUpdatedFields();
      let _update: UpdateFilter<unknown> = update as UpdateFilter<unknown>;
      if (Object.keys(update).includes('$set')) {
        _update = {
          $set: { ..._update['$set'], ...updatedFields },
        };
      } else {
        _update = {
          $set: { ...update, ...updatedFields },
        };
      }

      try {
        const result: T = await ctx.broker.call(fullActionName, {
          query: {
            ...addOwnershipToQuery(
              query,
              ownership,
              !DISABLE_ADDING_OWNERSHIP_CHECK
            ),
            ...(ENABLE_SOFT_DELETE ? { deleted: { $ne: true } } : {}),
          },
          update: {
            ...update,
            ..._update,
          },
          options,
        });
        return resultOk(result);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          error.message,
          'buildable-core',
          typeof error.retryable === 'boolean' ? error.retryable : true,
          error.data
        );
      }
    },
    async remove(id: string): Promise<BResult<number, 'service'>> {
      const fullActionName = `${service}.removeMany`;
      try {
        if (ENABLE_SOFT_DELETE) {
          return await updateById(id, { deleted: true });
        } else {
          let result: number = await ctx.broker.call(fullActionName, {
            query: addOwnershipToQuery(
              { _id: id },
              ownership,
              !DISABLE_ADDING_OWNERSHIP_CHECK
            ),
          });

          return resultOk(result);
        }
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          error.message,
          'buildable-core',
          typeof error.retryable === 'boolean' ? error.retryable : true,
          error.data
        );
      }
    },
    async removeMany(
      props: Rename<DeleteManyModel, 'filter', 'query'>
    ): Promise<BResult<number, 'service'>> {
      const fullActionName = `${service}.removeMany`;
      try {
        if (ENABLE_SOFT_DELETE) {
          return await updateMany({
            ...props,
            update: { $set: { deleted: true } },
          });
        } else {
          const result: number = await ctx.broker.call(fullActionName, {
            ...props,
            query: addOwnershipToQuery(
              props.query,
              ownership,
              !DISABLE_ADDING_OWNERSHIP_CHECK
            ),
          });

          return resultOk(result);
        }
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          error.message,
          'buildable-core',
          typeof error.retryable === 'boolean' ? error.retryable : true,
          error.data
        );
      }
    },
    async count(
      props: Pick<FindRequest, 'query'> = {}
    ): Promise<BResult<number, 'service'>> {
      const fullActionName = `${service}.count`;
      try {
        const result: number = await ctx.broker.call(fullActionName, {
          ...props,
          query: {
            ...addOwnershipToQuery(
              props.query,
              ownership,
              !DISABLE_ADDING_OWNERSHIP_CHECK
            ),
            ...(ENABLE_SOFT_DELETE ? { deleted: { $ne: true } } : {}),
          },
        });
        return resultOk(result);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          error.message,
          'buildable-core',
          typeof error.retryable === 'boolean' ? error.retryable : true,
          error.data
        );
      }
    },
  };
};
