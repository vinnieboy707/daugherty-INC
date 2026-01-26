const express = require('express');
const router = express.Router();
const {
  getAvailability,
  getAvailabilityByDate,
  createOrUpdateAvailability,
  updateAvailability,
  deleteAvailability,
  getCalendarMonth
} = require('../controllers/availabilityController');

// Public routes
router.get('/', getAvailability);
router.get('/calendar/month', getCalendarMonth);
router.get('/:date', getAvailabilityByDate);

// Admin routes (add authentication middleware in production)
router.post('/', createOrUpdateAvailability);
router.put('/:id', updateAvailability);
router.delete('/:id', deleteAvailability);

module.exports = router;
