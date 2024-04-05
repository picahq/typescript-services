export interface EventAccess {
  id: Id;
  name: string;
  key: string;
  namespace: string;
  platform: string;
  type: ConnectionType;
  group: string;
  ownership: Ownership;
  paths: Paths;
  accessKey: string;
  environment: 'test' | 'live';
  recordMetadata: RecordMetadata;
  createdAt: number;
  updatedAt: number;
  updated: boolean;
  version: Version;
  lastModifiedBy: string;
  deleted: boolean;
  changeLog: Record<string, number>;
  tags: string[];
  active: boolean;
  deprecated: boolean;
}

export interface EventAccessRecords {
  rows: EventAccess[];
  total: number;
  skip: number;
  limit: number;
}

interface Id {
  // Specify the type you expect for `id`
  // It might be a string or some other type
  // Adjust this according to your actual data
  id: string;
}

enum ConnectionType {
  Api,
  DatabaseSql,
  DatabaseNoSql,
  FileSystem,
  Stream,
  Custom,
}

interface Ownership {
  buildableId: string;
  clientId: string;
  organizationId?: string | null;
  projectId?: string | null;
  userId?: string | null;
}

interface Paths {
  id?: string | null;
  event?: string | null;
  payload?: string | null;
  timestamp?: string | null;
  secret?: string | null;
  signature?: string | null;
  cursor?: string | null;
}

interface Version {
  major: number;
  minor: number;
  patch: number;
  // You can add any additional fields needed for your version representation
}

interface RecordMetadata {
  createdAt: number;
  updatedAt: number;
  updated: boolean;
  version: Version;
  lastModifiedBy: string;
  deleted: boolean;
  changeLog: Record<string, number>;
  tags: string[];
  active: boolean;
  deprecated: boolean;
}

const eventTypes = ['id', 'sk'] as const;
const envs = ['test', 'live'] as const;

export type EventTypesKeys = (typeof eventTypes)[number];
export type EnvsKeys = (typeof envs)[number];
export type AnyString = string;

export type AccessKeyPrefix = `${EventTypesKeys}_${EnvsKeys}`;

export type ValidAccessKey = `${AccessKeyPrefix}_${AnyString}`;
