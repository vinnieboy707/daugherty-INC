const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const multer = require('multer');
const path = require('path');

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/review-photos/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'review-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Public routes
router.get('/', reviewController.getAllReviews);
router.get('/:id', reviewController.getReview);
router.post('/', upload.array('photos', 5), reviewController.createReview);
router.post('/:id/helpful', reviewController.markHelpful);

// Admin routes (in production, add authentication middleware)
router.put('/:id', reviewController.updateReview);
router.put('/:id/approve', reviewController.approveReview);
router.put('/:id/feature', reviewController.featureReview);
router.delete('/:id', reviewController.deleteReview);
router.get('/admin/pending', reviewController.getPendingReviews);
router.get('/admin/with-photos', reviewController.getReviewsWithPhotos);
router.post('/:reviewId/photos/:photoIndex/approve', reviewController.approvePhotoForPortfolio);

module.exports = router;
