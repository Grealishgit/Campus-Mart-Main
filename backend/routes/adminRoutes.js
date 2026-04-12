const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const { 
    loginAdmin,
     getStats,
      getAllUsers, 
      verifyUser,
       deleteUser, 
       getAllListings, 
       verifyListing
     } = require('../controllers/adminController');
const { adminOnly } = require('../middleware/authMiddleware');

router.post('/login', loginAdmin);
router.use(protect, adminOnly);
router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id/verify', verifyUser);
router.delete('/users/:id', deleteUser);
router.get('/listings', getAllListings);
router.put('/listings/:id/verify', verifyListing);

module.exports = router;