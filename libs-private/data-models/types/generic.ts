export interface Author {
  _id: string;
  name?: string;
  avatar?: string;
  [x: string]: unknown;
}

export interface Ownership {
  buildableId: string;
  clientId?: string;
  organizationId?: string;
  projectId?: string;
  author?: Author;
  userId?: string;
}

export type NodeEnvironments = 'development' | 'sandbox' | 'main';
