import { INTEGRATIONOS_VERSION } from '@libs-private/constants';
import { ListResponse } from '@libs-private/data-models';
import {
  EventAccessKeyData,
  EventAccessWithSecrets,
} from '@libs-private/data-models/types/eventAccess';
import { EventAccessInformation } from '@libs-private/data-models/types/events/event-access';
import { resultErr } from '@event-inc/utils/result';
import { ValidAccessKey } from '@event-inc/types';

export const getSecretInformation = (
  testSecret: EventAccessWithSecrets,
  liveSecret: EventAccessWithSecrets
): EventAccessInformation => {
  return {
    name: testSecret.name,
    createdAt: testSecret.createdAt,
    testKeyId: testSecret._id,
    liveKeyId: liveSecret._id,
    testKey: testSecret.secret,
    liveKey: liveSecret.secret,
  };
};

export const redactSecretValue = (secret: ValidAccessKey) => {
  return `${secret.slice(0, 7)}...${secret.slice(-4)}` as ValidAccessKey;
};

export const ensureBothEnvironmentsFound = (
  eventAccessRecords: Array<Pick<EventAccessWithSecrets, 'environment'>>
) => {
  if (eventAccessRecords.length !== 2) {
    return resultErr<'service'>(
      false,
      'service_4004',
      'Secret does not exist',
      'buildable-core',
      false
    );
  }

  if (!eventAccessRecords.find((result) => result.environment === 'test')) {
    return resultErr<'service'>(
      false,
      'service_4004',
      'Secret does not have a test environment',
      'buildable-core',
      false
    );
  }

  if (!eventAccessRecords.find((result) => result.environment === 'live')) {
    return resultErr<'service'>(
      false,
      'service_4004',
      'Secret does not have a live environment',
      'buildable-core',
      false
    );
  }
};

export const handleSecretRedaction = (
  redacted: boolean,
  eventAccessRecords: ListResponse<EventAccessWithSecrets>
) => {
  eventAccessRecords.rows = eventAccessRecords.rows.map((result) => {
    if (redacted) {
      result.secret = redactSecretValue(result.secret);
    }

    return result;
  });

  return eventAccessRecords;
};

export const producePartialTopicFromEventAccessKeyData = (
  eventAccessKeyData: EventAccessKeyData
) => {
  const buildableId = eventAccessKeyData[0][0];
  const namespace = eventAccessKeyData[1][0];
  const environment = eventAccessKeyData[1][1];
  const type = eventAccessKeyData[1][2];
  const group = eventAccessKeyData[1][3];

  return `${INTEGRATIONOS_VERSION}/${buildableId}.${namespace}.${environment}.${type}.${group}`;
};

export const getPathsFromEventAccessKeyData = (
  eventAccessKeyData: EventAccessKeyData
) => {
  const [event, objectId, timestamp] = eventAccessKeyData[2];

  return {
    event,
    objectId,
    timestamp,
  };
};
