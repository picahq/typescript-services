import('dotenv/config');

import { Context } from 'moleculer';
import jsonpath from 'jsonpath';
import { ListResponse, Ownership } from '@libs-private/data-models';
import { BResult } from '@event-inc/types/results';
import {
  matchResultAndHandleHttpError,
  resultOk,
} from '@event-inc/utils/result';
import {
  TestConnectionModelParams,
  TestModelReturn,
} from '@event-inc/types/connection-testing';
import { makeHttpNetworkCall } from '@event-inc/utils';
import { identity } from 'ramda';

type ENDPOINT_TYPES = {
  localhost: string;
  development: string;
  production: string;
};

const RUST_INTERNAL_API_ENDPOINTS = {
  GET_CONNECTION_MODEL_DEFINITIONS: `${process.env.CONNECTIONS_API_BASE_URL}v1/connection-model-definitions`,
  TEST_CONNECTION_MODEL_DEFINITION: `${process.env.CONNECTIONS_API_BASE_URL}v1/connection-model-definitions/test`
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const recursivelyReplace = (obj: any, keyName: string, value: any) => {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      recursivelyReplace(obj[i], keyName, value);
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          recursivelyReplace(obj[key], keyName, value);
        }
        if (key === keyName) {
          obj[key] = value;
        }
      }
    }
  }
};

const extractFields = (desiredFields: string[] = [], sample: object) => {
  let extractSingle = (obj: object) => {
    let result: any = {};

    desiredFields.forEach((fieldPath) => {
      let keys = fieldPath.split('.');
      let currentValue: any = obj;

      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];

        if (
          currentValue &&
          typeof currentValue === 'object' &&
          key in currentValue
        ) {
          if (i === keys.length - 1) {
            // If it's a top-level field, assign directly
            if (keys.length === 1) {
              result[key] = currentValue[key];
            } else {
              // For nested fields, create nested structure
              if (!result[keys[0]]) {
                result[keys[0]] = {};
              }
              result[keys[0]][key] = currentValue[key];
            }
          } else {
            currentValue = currentValue[key];
          }
        } else {
          break;
        }
      }
    });

    return result;
  };

  if (Array.isArray(sample)) {
    return sample.map((obj) => extractSingle(obj));
  } else {
    return extractSingle(sample);
  }
};

export const getDefaultConnectionModelDefinitions = async (
  connectionDefinitionId: string,
  modelName: string
) => {
  const url = RUST_INTERNAL_API_ENDPOINTS.GET_CONNECTION_MODEL_DEFINITIONS;
  const definitionsResult = await makeHttpNetworkCall<ListResponse<any>>({
    url,
    method: 'GET',
    headers: {},
    data: {},
    params: {
      connectionDefinitionId,
      modelName,
      limit: 1000,
    },
  });

  const definitions = matchResultAndHandleHttpError(
    definitionsResult,
    identity
  );

  const definitionsObject: any = {};

  definitions.data.rows.forEach((definition: any) => {
    definitionsObject[definition.actionName] = definition;
  });

  return definitionsObject;
};

export const testConnectionModelDefinition = async (
  connectionModelDefinitionId: string,
  connectionKey: string,
  request: {
    headers: Record<string, string> | null;
    body: Record<string, any> | null;
    pathParams: Record<string, string> | null;
    queryParams: Record<string, string> | null;
  } = {
      headers: {},
      body: {},
      pathParams: {},
      queryParams: {},
    }
) => {
  const convertValuesToStrings = (
    obj: Record<string, any> | null
  ): Record<string, string> => {
    const stringObj: Record<string, string> = {};
    if (obj) {
      Object.keys(obj).forEach((key) => {
        stringObj[key] = obj[key]?.toString();
      });
    }
    return stringObj;
  };

  const headers = convertValuesToStrings(request.headers);
  const pathParams = convertValuesToStrings(request.pathParams);
  const queryParams = convertValuesToStrings(request.queryParams);

  const url = RUST_INTERNAL_API_ENDPOINTS.TEST_CONNECTION_MODEL_DEFINITION;
  const testResult = await makeHttpNetworkCall<any>({
    url: `${url}/${connectionModelDefinitionId}`,
    method: 'POST',
    headers: {
      'x-integrationos-secret': process.env
        .QA_ACCOUNT_EVENT_ACCESS_KEY as string,
    },
    data: {
      connectionKey,
      request: {
        headers,
        body: request.body,
        pathParams,
        queryParams,
      },
    },
  });

  const res = matchResultAndHandleHttpError(testResult, identity);

  return {
    connectionModelDefinitionId,
    success: res.data.status.state["success"] !== undefined,
    request: request,
    testEndpointResponse: res.data,
  };
};

export const useConnectionModelTestingService = (
  ctx: Context,
  ownership: Ownership
) => {
  return {
    async testModel({
      connectionDefinitionId,
      connectionKey,
      modelName,
      modelConfig,
    }: TestConnectionModelParams): Promise<
      BResult<TestModelReturn[], 'service', unknown>
    > {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'Testing connection model definitions in production is disabled.'
        );
      }

      const connectionModelDefinitions =
        await getDefaultConnectionModelDefinitions(
          connectionDefinitionId,
          modelName
        );
      let createId: any = '';

      const output: TestModelReturn[] = [];

      // Step 1 - Test Create
      if (connectionModelDefinitions.create) {
        const createDef = connectionModelDefinitions.create;
        let createResponse: any = await testConnectionModelDefinition(
          createDef._id,
          connectionKey,
          {
            headers: {
              'Content-Type': 'application/json',
              ...createDef.samples.headers,
            },
            body: createDef.samples.body,
            pathParams: createDef.samples.pathParams,
            queryParams: createDef.samples.queryParams,
          }
        );

        output.push({
          action: 'create',
          ...createResponse,
        });

        createResponse = {
          body: JSON.parse(createResponse.testEndpointResponse.response),
        };

        const createIdPath = createDef.paths.response.id;

        createId = jsonpath.query(createResponse, createIdPath);

        if (createId.length > 0) {
          createId = createId[0];
        } else {
          throw new Error(
            'Failed to get createId from response body: ' +
            JSON.stringify(createResponse)
          );
        }

        await sleep(100);
      }

      // Step 2 - Test Update
      if (connectionModelDefinitions.update) {
        let updateDef = connectionModelDefinitions.update;
        const updateIdFieldName = modelConfig.updateIdFieldName;

        recursivelyReplace(
          updateDef,
          updateIdFieldName,
          createId || updateDef.samples.pathParams[updateIdFieldName]
        );

        let updateBody = extractFields(
          modelConfig.updateFields,
          updateDef.samples.body
        );

        const updateResponse = await testConnectionModelDefinition(
          updateDef._id,
          connectionKey,
          {
            headers: {
              'Content-Type': 'application/json',
              ...updateDef.samples.headers,
            },
            body: updateBody,
            pathParams: {
              ...updateDef.samples.pathParams,
            },
            queryParams: updateDef.samples.queryParams,
          }
        );

        output.push({
          action: 'update',
          ...updateResponse,
        });

        await sleep(100);
      }

      // Step 3 - Test Get One
      if (connectionModelDefinitions.getOne) {
        let getOneDef = connectionModelDefinitions.getOne;

        recursivelyReplace(
          getOneDef,
          modelConfig.getIdFieldName,
          createId || getOneDef.samples.pathParams[modelConfig.getIdFieldName]
        );

        const getOneResponse = await testConnectionModelDefinition(
          getOneDef._id,
          connectionKey,
          {
            headers: {
              'Content-Type': 'application/json',
              ...getOneDef.samples.headers,
            },
            body: null,
            pathParams: {
              ...getOneDef.samples.pathParams,
            },
            queryParams: getOneDef.samples.queryParams,
          }
        );

        output.push({
          action: 'getOne',
          ...getOneResponse,
        });

        await sleep(100);
      }

      // Step 4 - Test Get Many
      if (connectionModelDefinitions.getMany) {
        let getManyDef = connectionModelDefinitions.getMany;
        const getManyResponse = await testConnectionModelDefinition(
          getManyDef._id,
          connectionKey,
          {
            headers: {
              'Content-Type': 'application/json',
              ...getManyDef.samples.headers,
            },
            body: null,
            pathParams: {
              ...getManyDef.samples.pathParams,
            },
            queryParams: getManyDef.samples.queryParams,
          }
        );

        output.push({
          action: 'getMany',
          ...getManyResponse,
        });

        await sleep(100);
      }

      // Step 5 - Test Get Count
      if (connectionModelDefinitions.getCount) {
        let getCountDef = connectionModelDefinitions.getCount;
        const getCountResponse = await testConnectionModelDefinition(
          getCountDef._id,
          connectionKey,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            body: null,
            pathParams: null,
            queryParams: null,
          }
        );

        output.push({
          action: 'getCount',
          ...getCountResponse,
        });

        await sleep(100);
      }

      // Step 6 - Test Delete
      if (connectionModelDefinitions.delete) {
        let deleteDef = connectionModelDefinitions.delete;

        if (modelConfig.customDeleteValue) {
          let templatedDeleteValue = modelConfig.customDeleteValue.replace(
            'CREATE_ID',
            createId ||
            deleteDef.samples.pathParams[modelConfig.deleteIdFieldName]
          );

          try {
            JSON.parse(templatedDeleteValue);
          } catch (e) {
            throw new Error(
              'Failed to parse customDeleteValue as JSON: ' +
              templatedDeleteValue
            );
          }

          recursivelyReplace(
            deleteDef,
            modelConfig.deleteIdFieldName,
            JSON.parse(templatedDeleteValue)
          );
        } else {
          recursivelyReplace(
            deleteDef,
            modelConfig.deleteIdFieldName,
            createId ||
            deleteDef.samples.pathParams[modelConfig.deleteIdFieldName]
          );
        }

        const deleteResponse = await testConnectionModelDefinition(
          deleteDef._id,
          connectionKey,
          {
            headers: {
              'Content-Type': 'application/json',
              ...deleteDef.samples.headers,
            },
            body: null,
            pathParams: {
              ...deleteDef.samples.pathParams,
            },
            queryParams: deleteDef.samples.queryParams,
          }
        );

        output.push({
          action: 'delete',
          ...deleteResponse,
        });

        await sleep(100);
      }

      return resultOk(output);
    },
  };
};
