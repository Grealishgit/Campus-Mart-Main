/**
 * Request Validation Middleware
 * Validates request data against Zod schemas
 */
const { ZodError } = require('zod');

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Replace request data with validated/coerced data
      req.body = validatedData.body || req.body;
      req.params = validatedData.params || req.params;
      req.query = validatedData.query || req.query;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));

        return res.status(400).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: messages.slice(0, 5), // Return first 5 errors
        });
      }

      next(error);
    }
  };
};

module.exports = validateRequest;
