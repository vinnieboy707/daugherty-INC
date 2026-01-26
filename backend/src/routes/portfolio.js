const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const upload = require('../config/upload');

// Portfolio routes
router.get('/', portfolioController.getAllPortfolio);
router.post('/', upload.single('image'), portfolioController.uploadPortfolio);
router.put('/:id', portfolioController.updatePortfolio);
router.put('/order/update', portfolioController.updateDisplayOrder);
router.delete('/:id', portfolioController.deletePortfolio);

module.exports = router;
