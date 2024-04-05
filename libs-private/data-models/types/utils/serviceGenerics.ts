import { Ownership } from '../generic';
import { MongoError } from 'mongodb';

export interface WithCreate {
  createdAt: number;
  createdDate: Date;
}

export interface WithUpdate {
  updatedAt?: number;
  updatedDate?: Date;
}

export interface WithOwnership {
  ownership: Ownership;
}

export interface WithId {
  _id: string;
}

export interface ListResponse<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListRequest {
  query?: Record<string, unknown>;
  page?: number;
  pageSize?: number;
  sort?: Record<string, unknown>;
  populate?: string[];
  fields?: string[];
}

export type FindRequest = Omit<ListRequest, 'page' | 'pageSize'> & {
  limit?: number;
  offset?: number;
};

export interface CreateRequest {
  [key: string]: unknown;
}

export interface GetRequest {
  [key: string]: unknown;
}

export type ServiceCreate<T> = T & WithCreate & WithOwnership;

export interface Update<Q, U> {
  query: Record<string, Q>;
  update: Record<string, U>;
  options?: Record<string, unknown>;
}

export type ServiceUpdate<Q, U> = Update<Q, U> & WithUpdate & WithOwnership;
export interface ExtendedMongoError extends MongoError {
  code: number;
  keyValue: any;
  [key: string]: any;
}
