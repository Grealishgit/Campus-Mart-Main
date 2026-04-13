const express = require('express');
const router = express.Router();

// Middleware
const { protect } = require('../middleware/authMiddleware');

// Controllers
const {
    getConversations,
    startConversation,
    getMessages,
    sendMessage
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

router.get('/', protect, asyncHandler(getConversations));
router.post('/start', protect, validateRequest(startConversationSchema), asyncHandler(startConversation));
router.get('/:conversationId/messages', protect, validateRequest(getMessagesSchema), asyncHandler(getMessages));
router.post('/:conversationId/messages', protect, messageLimiter, validateRequest(sendMessageSchema), asyncHandler(sendMessage));

module.exports = router;