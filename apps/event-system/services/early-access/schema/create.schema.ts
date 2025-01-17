import { createSchema } from '@libs-private/generic-schema/create.schema';

export const createEarlyAccessSchema = {
  ...createSchema,
  companyName: {
    type: 'string'
  },
  companyLinkedInUrl: {
    type: 'string'
  },
  userLinkedInUrl: {
    type: 'string'
  },
  useCase: {
    type: 'string'
  },
  type: {
    type: 'string'
  }
}
