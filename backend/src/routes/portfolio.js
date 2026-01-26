const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const portfolioController = require('../controllers/portfolioController');
const upload = require('../config/upload');
const validate = require('../middleware/validate');
const { adminAuth } = require('../middleware/auth');

// Portfolio routes
router.get('/', portfolioController.getAllPortfolio);
router.post('/', adminAuth, upload.single('image'), portfolioController.uploadPortfolio);
router.put(
  '/:id',
  adminAuth,
  [param('id').isMongoId()],
  validate,
  portfolioController.updatePortfolio
);
router.put('/order/update', adminAuth, portfolioController.updateDisplayOrder);
router.delete(
  '/:id',
  adminAuth,
  [param('id').isMongoId()],
  validate,
  portfolioController.deletePortfolio
);

module.exports = router;
