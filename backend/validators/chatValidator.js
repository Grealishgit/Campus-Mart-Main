/**
 * Chat Request Validators
 * Using Zod for schema validation
 */
const { z } = require('zod');

const startConversationSchema = z.object({
  body: z.object({
    // Required so the controller knows which listing table to query
    type: z.enum(['sale', 'lease'], {
      errorMap: () => ({ message: "type must be 'sale' or 'lease'" }),
    }),
    listing_id: z.coerce.number()
      .int()
      .positive('Listing ID must be valid'),
  }),
});

const sendMessageSchema = z.object({
  body: z.object({
    text: z.string()
      .min(1, 'Message cannot be empty')
      .max(5000, 'Message cannot exceed 5000 characters')
      .trim(),
  }),
  params: z.object({
    // conversationId is a DB integer — coerce and validate as such
    conversationId: z.coerce.number()
      .int()
      .positive('Invalid conversation ID'),
  }),
});

const getMessagesSchema = z.object({
  params: z.object({
    conversationId: z.coerce.number()
      .int()
      .positive('Invalid conversation ID'),
  }),
  query: z.object({
    page:  z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
  }),
});

module.exports = {
  startConversationSchema,
  sendMessageSchema,
  getMessagesSchema,
};