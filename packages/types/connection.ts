export interface ConnectionRecord {
  _id: string;
  platformVersion: string;
  connectionDefinitionId: string;
  name: string;
  key: string;
  group: string;
  environment: string;
  platform: string;
  secretsServiceId: string;
  eventAccessId: string;
  accessKey: string;
  settings: {
    parseWebhookBody: boolean;
    showSecret: boolean;
    allowCustomEvents: boolean;
    oauth: boolean;
  };
  throughput: {
    key: string;
    limit: number;
  };
  ownership: {
    buildableId: string;
    clientId: string;
    organizationId: string;
    projectId: string;
    userId: string;
  };
  createdAt: number;
  updatedAt: number;
  updated: boolean;
  version: string;
  lastModifiedBy: string;
  deleted: boolean;
  changeLog: Record<string, any>; // You can replace 'any' with a more specific type if needed
  tags: string[];
  active: boolean;
  deprecated: boolean;
}

export interface Connections {
  rows: ConnectionRecord[];
  limit: number;
  skip: number;
  total: number;
}
