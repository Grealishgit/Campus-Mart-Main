const { z } = require('zod');

const createOrderSchema = z.object({
  body: z.object({
    type: z.enum(['SALE', 'LEASE'], {
      errorMap: () => ({ message: 'type must be SALE or LEASE' }),
    }),
    listing_id: z.coerce.number()
      .int()
      .positive('Listing ID must be valid'),
    lease_start: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'lease_start must be YYYY-MM-DD format')
      .optional(),
    lease_end: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'lease_end must be YYYY-MM-DD format')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'LEASE') {
        return !!data.lease_start && !!data.lease_end;
      }
      return true;
    },
    { message: 'lease_start and lease_end are required for LEASE orders', path: ['lease_start'] }
  )
  .refine(
    (data) => !(data.lease_start && !data.lease_end) && !(!data.lease_start && data.lease_end),
    { message: 'lease_start and lease_end must be provided together', path: ['lease_start'] }
  ),
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled'], {
      errorMap: () => ({ message: 'Status must be pending, confirmed, completed, or cancelled' }),
    }),
  }),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};