/**
 * Listing Request Validators
 * Using Zod for schema validation
 */
const { z } = require('zod');

const VALID_CATEGORIES = [
  'Textbooks',
  'Tech',
  'Dorm Decor',
  'Bikes',
  'Leisure',
  'Electronics',
  'Clothing',
  'Household',
];

const VALID_CONDITIONS = ['Brand New', 'Like New', 'Excellent', 'Good', 'Used - Like New', 'Fair'];
const VALID_PRICE_UNITS = ['/hour', '/day', '/week', '/month'];
const VALID_DURATION_UNITS = ['hours', 'days', 'weeks', 'months'];

const createListingSchema = z.object({
  body: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title cannot exceed 200 characters')
      .trim(),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description cannot exceed 5000 characters')
      .trim(),
    price: z.coerce.number()
      .positive('Price must be positive')
      .finite('Invalid price'),
    type: z.enum(['SALE', 'LEASE'], {
      errorMap: () => ({ message: 'Type must be SALE or LEASE' }),
    }),
    category: z.enum(VALID_CATEGORIES, {
      errorMap: () => ({ message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` }),
    }),
    condition: z.enum(VALID_CONDITIONS, {
      errorMap: () => ({ message: `Condition must be one of: ${VALID_CONDITIONS.join(', ')}` }),
    }),
    location: z.string()
      .min(3, 'Location required')
      .max(200, 'Location too long')
      .trim(),
    price_unit: z.enum(VALID_PRICE_UNITS).optional(),
    min_duration: z.coerce.number().int().positive().optional(),
    max_duration: z.coerce.number().int().positive().optional(),
    duration_unit: z.enum(VALID_DURATION_UNITS).optional(),
    available_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'available_from must be YYYY-MM-DD format').optional(),
    available_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'available_until must be YYYY-MM-DD format').optional(),
  })
  .refine(
    (data) => data.type === 'SALE' || (data.type === 'LEASE' && data.price_unit),
    { message: 'price_unit is required for LEASE listings', path: ['price_unit'] }
  )
  .refine(
    (data) => data.type === 'SALE' || !data.max_duration || !data.min_duration || data.max_duration >= data.min_duration,
    { message: 'max_duration must be greater than or equal to min_duration', path: ['max_duration'] }
  ),
});

const updateListingSchema = z.object({
  body: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title cannot exceed 200 characters')
      .trim()
      .optional(),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description cannot exceed 5000 characters')
      .trim()
      .optional(),
    price: z.coerce.number()
      .positive('Price must be positive')
      .finite('Invalid price')
      .optional(),
    category: z.enum(VALID_CATEGORIES).optional(),
    condition: z.enum(VALID_CONDITIONS).optional(),
    location: z.string()
      .min(3, 'Location required')
      .max(200, 'Location too long')
      .trim()
      .optional(),
    price_unit: z.enum(VALID_PRICE_UNITS).optional(),
    min_duration: z.coerce.number().int().positive().optional(),
    max_duration: z.coerce.number().int().positive().optional(),
    duration_unit: z.enum(VALID_DURATION_UNITS).optional(),
    available_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'available_from must be YYYY-MM-DD format').optional(),
    available_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'available_until must be YYYY-MM-DD format').optional(),
    is_available: z.boolean().optional(),
  }),
});

const getListingsSchema = z.object({
  query: z.object({
    type: z.enum(['SALE', 'LEASE']).optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    condition: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

module.exports = {
  createListingSchema,
  updateListingSchema,
  getListingsSchema,
  VALID_CATEGORIES,
  VALID_CONDITIONS,
  VALID_PRICE_UNITS,
  VALID_DURATION_UNITS,
};
