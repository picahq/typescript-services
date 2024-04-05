export interface Author {
  _id: string;
  name?: string;
  avatar?: string;
  [x: string]: unknown;
}

export interface Ownership {
  buildableId: string;
  clientId?: string;
  projectId?: string;
  organizationId?: string;
  author?: Author;
  userId?: string;
}
export interface ListRequest {
  query?: Record<string, unknown>;
  page?: number;
  pageSize?: number;
  sort?: Record<string, unknown>;
  populate?: string[];
  fields?: string[];
}

export interface ClientRecord {
  _id: string;
  createdAt: number;
  buildableId: string;
  name: string;
  author: {
    _id: string;
  };
  containers: {
    _id: string;
    createdAt: number;
    subscription: {
      tier: string;
    };
  }[];
  settings?: ClientSettings;
}

export interface ClientSettings {
  restrictions: {
    queues: {
      development: number;
      sandbox: number;
      main: number;
    };
    workersPerQueue: {
      development: number;
      sandbox: number;
      main: number;
    };
  };
}
