const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const { loginAdmin, getStats, getAllUsers, verifyUser, deleteUser, getAllListings, verifyListing } = require('../controllers/adminController');
const { adminOnly } = require('../middleware/authMiddleware');

adminRouter.post('/login', loginAdmin);
adminRouter.use(protect, adminOnly);
adminRouter.get('/stats', getStats);
adminRouter.get('/users', getAllUsers);
adminRouter.put('/users/:id/verify', verifyUser);
adminRouter.delete('/users/:id', deleteUser);
adminRouter.get('/listings', getAllListings);
adminRouter.put('/listings/:id/verify', verifyListing);

module.exports = router;