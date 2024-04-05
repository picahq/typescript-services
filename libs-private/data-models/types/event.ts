import { EnvironmentTypes } from './eventAccess';
import { Ownership } from './generic';

export interface Event {
  _id: string;
  key: string;
  topic?: string;
  environment: EnvironmentTypes;
  body: any;
  query?: any;
  headers?: any;
  createdAt?: number;
  createdDate?: Date;
  arrivedAt: number;
  arrivedDate: Date;
  state: 'pending' | 'acknowledged' | 'cancelled' | 'dropped';
  ttl: number;
  _v: number;
  ownership: Ownership;
  hashes: HashRecord[];
  address: string;
  privateKey: string;
  publicKey: string;
  signature?: string;
  eventByteLength?: number;
  metadata?: Record<string, string>;
  duplicates?: EventDuplicates;
}

export type EventDuplicates = {
  eventHashFound: number;
  bodyHashFound: number;
  modelBodyHashFound: number;
  possibleCollision: boolean;
  sampleEventKeysWithPossibleCollision: string[];
};

export type HashRecord = {
  type: 'body' | 'event' | 'model::body';
  hash: string;
};

export interface HistoryRecord {
  enterState: string;
  exitState: string;
  timestamp: number;
  updatedBy: string;
}
