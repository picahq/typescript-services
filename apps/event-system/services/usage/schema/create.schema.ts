export const createUsageSchema = {
    type: {
        type: 'string',
        enum: ['buildkit', 'chat'],
        required: true,
    }
}