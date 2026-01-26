const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Public routes
router.get('/', reviewController.getAllReviews);
router.get('/:id', reviewController.getReview);
router.post('/', reviewController.createReview);
router.post('/:id/helpful', reviewController.markHelpful);

// Admin routes (in production, add authentication middleware)
router.put('/:id', reviewController.updateReview);
router.put('/:id/approve', reviewController.approveReview);
router.put('/:id/feature', reviewController.featureReview);
router.delete('/:id', reviewController.deleteReview);
router.get('/admin/pending', reviewController.getPendingReviews);

module.exports = router;
