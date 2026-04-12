const express = require('express');
const router = express.Router();
const {
  getListings, getListingById, createListing,
  updateListing, deleteListing, getMyListings, getCategories, getConditions
} = require('../controllers/listingController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getListings);
router.get('/categories', getCategories);
router.get('/conditions', getConditions);
router.get('/my', protect, getMyListings);
router.get('/:id', getListingById);
router.post('/', protect, upload.single('image'), createListing);
router.put('/:id', protect, upload.single('image'), updateListing);
router.delete('/:id', protect, deleteListing);

module.exports = router;
