import { Ownership } from '@libs-private/data-models';

export const generateMeta = (ownership: Ownership) => ({
  meta: {
    user: {
      _id: ownership.userId,
    },
    buildable: {
      _id: ownership.buildableId,
      buildableId: ownership.buildableId,
    },
  },
});
