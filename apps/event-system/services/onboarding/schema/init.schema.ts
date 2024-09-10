export const initOnboardingSchema = {
  id: {
    type: 'string',
    required: true,
  },

  name: {
    type: 'string',
    required: true,
  },
  email: {
    type: 'string',
    optional: true,
  },
};

