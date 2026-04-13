/**
 * Auth Request Validators
 * Using Zod for schema validation
 */
const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    email: z.string()
      .email('Invalid email format')
      .refine(
        (email) => /^[^\s@]+@[^\s@]+\.(ac\.ke|edu)$/.test(email),
        'Must be a university email (.ac.ke or .edu)'
      ),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[0-9]/, 'Password must contain number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
    faculty: z.string().max(100).optional(),
    graduation_year: z.coerce.number().int().min(2024).max(2030).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Invalid email format'),
    password: z.string()
      .min(1, 'Password required'),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .optional(),
    faculty: z.string().max(100).optional(),
    graduation_year: z.coerce.number().int().min(2024).max(2030).optional(),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token required'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[0-9]/, 'Password must contain number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  }),
});

const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token required'),
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token required'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
};
