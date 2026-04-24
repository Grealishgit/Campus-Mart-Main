const express = require('express');
const router = express.Router();

// Middleware
const { protect } = require('../middleware/authMiddleware');

// Controllers
const {
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
} = require('../controllers/chatController');

// Validation & Rate Limiting
const validateRequest = require('../middleware/validateRequest');
const { messageLimiter } = require('../middleware/rateLimiter');

// Validators
const {
  startConversationSchema,
  sendMessageSchema,
  getMessagesSchema,
} = require('../validators/chatValidator');

// Error Handling
const { asyncHandler } = require('../utils/errorHandler');

// ==================== ROUTES ====================

// GET  /api/chats                              → all conversations for current user
router.get('/', protect, asyncHandler(getConversations));

// POST /api/chats/start                        → get or create a conversation
// NOTE: must stay above /:conversationId/messages to avoid being swallowed by the param route
router.post('/start', protect, validateRequest(startConversationSchema), asyncHandler(startConversation));

// GET  /api/chats/:conversationId/messages     → paginated message history
router.get('/:conversationId/messages', protect, validateRequest(getMessagesSchema), asyncHandler(getMessages));

// POST /api/chats/:conversationId/messages     → send a message (rate limited)
router.post('/:conversationId/messages', protect, messageLimiter, validateRequest(sendMessageSchema), asyncHandler(sendMessage));

module.exports = router;