import { get } from 'lodash';
import { EnvironmentTypes } from '@libs-private/data-models';

export const constructEventName = (
  eventName: string,
  eventAccessRecord: any
) => {
  return `${get(eventAccessRecord, 'ownership.buildableId')}.${
    eventAccessRecord.namespace
  }.${eventAccessRecord.type}.${eventAccessRecord.group}.${eventName}`;
};

export const constructTopic = (
  eventName: string,
  eventAccessRecord: any,
  version?: string
) => {
  return `${version || 'v1'}/${get(
    eventAccessRecord,
    'ownership.buildableId'
  )}.${eventAccessRecord.namespace}.${eventAccessRecord.environment}.${
    eventAccessRecord.type
  }.${eventAccessRecord.group}.${eventName}`;
};

export const constructTopicManually = (
  buildableId: string,
  namespace: string,
  environment: string,
  type: string,
  group: string,
  eventName: string,
  version?: string
) => {
  return `${
    version || 'v1'
  }/${buildableId}.${namespace}.${environment}.${type}.${group}.${eventName}`;
};

export const getTopicDetails = (topic: string) => {
  const splitTopic = topic.split('.');
  const [bldInfo] = splitTopic;

  if (bldInfo.startsWith('v1/')) {
    const [, namespace, environment, type, group, ...rest] = splitTopic;

    return {
      buildableId: bldInfo.replace('v1/', ''),
      bldInfo,
      namespace,
      environment: environment as EnvironmentTypes,
      type,
      group,
      eventName: rest.join('.'),
    };
  } else {
    const [, namespace, type, group, ...rest] = splitTopic;

    return {
      buildableId: bldInfo,
      bldInfo,
      namespace,
      type,
      group,
      eventName: rest.join('.'),
    };
  }
};
