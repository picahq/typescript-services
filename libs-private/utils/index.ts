import {
  WithCreate,
  WithOwnership,
  WithUpdate,
} from '@libs-private/data-models';

export const getCreatedFields = (): WithCreate => ({
  createdAt: Date.now(),
  createdDate: new Date(),
});

export const getUpdatedFields = (): WithUpdate => ({
  updatedAt: Date.now(),
  updatedDate: new Date(),
});

export const getOwnership = (
  buildableId: string,
  userId: string
): WithOwnership => ({
  ownership: {
    buildableId: buildableId,
    author: {
      _id: userId,
    },
    clientId: buildableId,
    organizationId: buildableId,
    projectId: buildableId,
  },
});

export * from './ids';
