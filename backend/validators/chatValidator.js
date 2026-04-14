/**
 * Chat Request Validators
 * Using Zod for schema validation
 */
const { z } = require('zod');

const startConversationSchema = z.object({
  body: z.object({
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
    conversationId: z.string().min(1, 'Conversation ID required'),
  }),
});

const getMessagesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
  }),
});

module.exports = {
  startConversationSchema,
  sendMessageSchema,
  getMessagesSchema,
};
