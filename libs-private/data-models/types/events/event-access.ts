import { ValidAccessKey } from '@event-inc/types';
import {
  EventObjectIdentifierPath,
  EventPath,
  EventTimestampPath,
} from '../eventAccess';

export interface EventAccessVerify {
  secret: string;
  headers: Record<string, string>;
  event: string;
  payload: Record<string, unknown>;
}

export interface EventAccessVerifyIdentifier {
  secretOrIdentifier: string;
  headers: Record<string, string>;
  event: string;
  body: Record<string, unknown>;
}

export interface EventAccessVerifyIdentifierService {
  identifier: string;
  headers: Record<string, string>;
  event: string;
  body: Record<string, unknown>;
}

export interface EventAccessCreateSecretPayload {
  name: string;
  type?: string;
  group?: string;
}

export interface EventAccessInformation {
  name: string;
  createdAt: number;
  testKeyId: string;
  liveKeyId: string;
  testKey: ValidAccessKey;
  liveKey: ValidAccessKey;
}

export interface EventAccessKeyInformation {
  _id: string;
  name: string;
  key: string;
  namespace: string;
  platform: string;
  type: string;
  group: string;
  ownership: {
    buildableId: string;
    clientId: string;
    organizationId: string;
    projectId: string;
    userId: string;
  };
  paths: {
    id: string;
    event: string;
    payload: string;
    timestamp: string | null;
    secret: string | null;
    signature: string | null;
    cursor: string | null;
  };
  accessKey: string;
  environment: string;
  createdAt: number;
  updatedAt: number;
  updated: boolean;
  version: string;
  lastModifiedBy: string;
  deleted: boolean;
  changeLog: Record<string, unknown>; // This can be more specific if you have known keys and value types.
  tags: string[]; // You can specify the type of elements in the array if needed.
  active: boolean;
  deprecated: boolean;
}

export interface EventAccessVerifySecretPayload {
  secret: ValidAccessKey;
}

export interface EventAccessVerifySecretPayload {
  secret: ValidAccessKey;
}

export interface VerifyViaEncryptionResponse {
  topicPrefix: string;
  paths: {
    event: EventPath;
    objectId: EventObjectIdentifierPath;
    timestamp: EventTimestampPath;
  };
}
