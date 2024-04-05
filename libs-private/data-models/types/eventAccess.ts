import { ValidAccessKey } from '@event-inc/types';
import { Ownership } from './generic';

const eventTypes = ['id', 'sk'] as const;
const envs = ['test', 'live'] as const;

export type EventTypesKeys = (typeof eventTypes)[number];
export type EnvsKeys = (typeof envs)[number];
type AnyString = string;

export type AccessKeyPrefix = `${EventTypesKeys}_${EnvsKeys}`;

export type EnvironmentTypes = 'test' | 'live';

export type EventAccessKey = `${AnyString}%${AnyString}%${AnyString}`;
export type EventAccessKeyWithPrefix = `${AccessKeyPrefix}_${EventAccessKey}`;

export type BuildableId = AnyString;

export interface EventAccessBase {
  _id?: string;
  _v: string;
  key: string;
  title?: string;
  namespace: string;
  type: string;
  group: string;
  paths: any | null;
  createdDate: Date;
  createdAt: number;
  updatedAt?: number;
  active: boolean;
  environment: EnvironmentTypes;
  ownership: Ownership;
  deleted: boolean;
}

export interface EventAccessWithIdentifiers extends EventAccessBase {
  identifier: ValidAccessKey;
  integrationWebhookId: string | null;
  integrationSecretKey: string | null;
}

export interface EventAccessWithSecrets extends EventAccessBase {
  name: string;
  slug: string;
  secret: ValidAccessKey;
}

export interface CreateEventAccessWithIdentifiersPayload {
  _v: string;
  name: string;
  namespace?: string;
  type: string;
  ownership: Ownership;
  paths: any;
  integrationWebhookId: string;
  integrationSecretKey: string;
  environment?: EnvironmentTypes;
  active?: boolean;
  identifier?: ValidAccessKey;
}

export interface CreateEventAccessWithSecretsPayload {
  _v?: string;
  name: string;
  namespace?: string;
  type: string;
  group: string;
  ownership: Ownership;
  environment: EnvironmentTypes;
  active?: boolean;
  paths?: any;
}

export interface EventCreateInitialPayload {
  eventAccess: EventAccessWithSecrets | EventAccessWithIdentifiers;
  topic: string;
  eventName: string;
  environment: EnvironmentTypes;
  ownership: Ownership;
  body: Record<string, unknown> | string;
  headers: Record<string, string>;
  query?: Record<string, string>;
  secret: string;
}

export type EventNamespace = {
  value: string;
};

export type EventType = {
  value: string;
};

export type EventGroup = {
  value: string;
};
export type EventEnvironment = {
  value: string;
};
export type EventObjectIdentifierPath = {
  value: string;
};
export type EventPath = {
  value: string;
};
export type EventTimestampPath = {
  value: string;
};

export type BuildableIdCasted = {
  value: string;
};

export type UserIdCasted = {
  value: string;
};

export type EventAccessKeyData = [
  [BuildableIdCasted],
  [EventNamespace, EventEnvironment, EventType, EventGroup],
  [EventPath, EventObjectIdentifierPath, EventTimestampPath]
];

export function castToShallowType<T extends { value: any }>(
  value: T
): T['value'] {
  return value as T['value'];
}

export function castToSpecificType<
  T extends { value: any } = {
    value: never;
  }
>(value: T['value']): T {
  return value as T;
}
