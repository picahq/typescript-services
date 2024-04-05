export interface ConnectionDefinition {
  authMethod: object | null; // You can specify the correct data type for authMethod if needed
  _id: string;
  platformVersion: string;
  platform: string;
  type: string;
  name: string;
  authSecrets: any[]; // You can specify the correct data type for authSecrets if needed
  frontend: {
    spec: {
      title: string;
      description: string;
      platform: string;
      category: string;
      image: string;
      tags: string[];
    };
    connectionForm: {
      name: string;
      description: string;
      formData: any[]; // You can specify the correct data type for formData if needed
    };
  };
  paths: {
    id: any; // You can specify the correct data type for id if needed
    event: any; // You can specify the correct data type for event if needed
    payload: any; // You can specify the correct data type for payload if needed
    timestamp: string;
    secret: string;
    signature: any; // You can specify the correct data type for signature if needed
    cursor: any; // You can specify the correct data type for cursor if needed
  };
  settings: {
    parseWebhookBody: boolean;
    showSecret: boolean;
    allowCustomEvents: boolean;
    oauth: boolean;
  };
  hidden: boolean;
  testConnection: any; // You can specify the correct data type for testConnection if needed
  createdAt: number;
  updatedAt: number;
  updated: boolean;
  version: string;
  lastModifiedBy: string;
  deleted: boolean;
  changeLog: Record<string, any>; // Assuming changeLog is a dictionary
  tags: string[]; // You can specify the correct data type for tags if needed
  active: boolean;
  deprecated: boolean;
}

export interface ConnectionDefinitions {
  rows: ConnectionDefinition[];
  limit: number;
  skip: number;
  total: number;
}
