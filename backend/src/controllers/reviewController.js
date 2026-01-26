const Review = require('../models/Review');
const Portfolio = require('../models/Portfolio');

// Get all approved reviews
exports.getAllReviews = async (req, res) => {
  try {
    const { featured, minRating, limit } = req.query;
    
    const filter = {
      isApproved: true,
      isVisible: true
    };
    
    if (featured === 'true') {
      filter.isFeatured = true;
    }
    
    if (minRating) {
      filter.rating = { $gte: parseInt(minRating) };
    }
    
    const limitNum = limit ? parseInt(limit) : 100;
    
    const reviews = await Review.find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limitNum);
    
    const stats = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStars: {
            $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
          },
          fourStars: {
            $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
          },
          threeStars: {
            $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
          },
          twoStars: {
            $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
          },
          oneStar: {
            $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: reviews,
      stats: stats[0] || {
        averageRating: 0,
        totalReviews: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new review
exports.createReview = async (req, res) => {
  try {
    const { rating, title, comment, authorName, isAnonymous, tattooType } = req.body;
    
    // Validation
    if (!rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        error: 'Rating, title, and comment are required'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }
    
    // Handle submitted photos
    const submittedPhotos = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        submittedPhotos.push({
          filename: file.filename,
          path: file.path,
          url: `/uploads/${file.filename}`,
          uploadedAt: new Date(),
          approvedForPortfolio: false
        });
      });
    }
    
    const review = new Review({
      rating,
      title,
      comment,
      authorName: isAnonymous ? 'Anonymous' : (authorName || 'Anonymous'),
      isAnonymous: isAnonymous || false,
      tattooType,
      submittedPhotos,
      isApproved: false  // Requires admin approval
    });
    
    await review.save();
    
    res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully! It will be visible after approval.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single review
exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update review (admin only)
exports.updateReview = async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: Date.now() };
    
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve review (admin only)
exports.approveReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    
    res.json({ success: true, data: review, message: 'Review approved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Feature review (admin only)
exports.featureReview = async (req, res) => {
  try {
    const { featured } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isFeatured: featured, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    
    res.json({
      success: true,
      data: review,
      message: featured ? 'Review featured' : 'Review unfeatured'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete review (admin only)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get pending reviews (admin only)
exports.getPendingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isApproved: false })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get reviews with submitted photos (admin only)
exports.getReviewsWithPhotos = async (req, res) => {
  try {
    const reviews = await Review.find({
      'submittedPhotos.0': { $exists: true }
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve photo from review for portfolio (admin only)
exports.approvePhotoForPortfolio = async (req, res) => {
  try {
    const { reviewId, photoIndex } = req.params;
    const { description, tags } = req.body;
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    
    if (!review.submittedPhotos[photoIndex]) {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }
    
    const photo = review.submittedPhotos[photoIndex];
    
    // Create new portfolio entry
    const portfolioItem = new Portfolio({
      image: {
        filename: photo.filename,
        path: photo.path,
        url: photo.url
      },
      description: description || `Client submission - ${review.tattooType || 'tattoo'}`,
      tags: tags || [review.tattooType || 'client-submission'],
      isVisible: true,
      order: await Portfolio.countDocuments() + 1
    });
    
    await portfolioItem.save();
    
    // Mark photo as approved in review
    review.submittedPhotos[photoIndex].approvedForPortfolio = true;
    review.submittedPhotos[photoIndex].portfolioId = portfolioItem._id;
    await review.save();
    
    res.json({
      success: true,
      message: 'Photo approved and added to portfolio',
      data: {
        portfolioItem,
        review
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
