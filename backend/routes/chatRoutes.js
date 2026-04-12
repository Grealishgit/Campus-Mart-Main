
// chat routes
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getConversations,
    startConversation,
    getMessages,
    sendMessage } = require('../controllers/chatController');

router.get('/', protect, getConversations);
router.post('/start', protect, startConversation);
router.get('/:conversationId/messages', protect, getMessages);
router.post('/:conversationId/messages', protect, sendMessage);

module.exports = router;