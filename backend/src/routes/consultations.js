const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const consultationController = require('../controllers/consultationController');
const upload = require('../config/upload');
const validate = require('../middleware/validate');
const { adminAuth } = require('../middleware/auth');

// Consultation routes
router.post(
  '/',
  upload.fields([
    { name: 'referenceImages', maxCount: 5 },
    { name: 'selfie', maxCount: 1 }
  ]),
  [
    // Validation rules - optional fields, sanitized when present
    body('firstName').optional().isString().trim().isLength({ max: 100 }),
    body('lastName').optional().isString().trim().isLength({ max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString().trim().isLength({ max: 30 }),
    body('bestContactTime').optional().isString().trim(),
    body('description').optional().isString().trim().isLength({ max: 2000 }),
    body('backgroundStory').optional().isString().trim().isLength({ max: 2000 }),
    body('placement').optional().isString().trim().isLength({ max: 200 }),
    body('painThreshold').optional().isString().trim(),
    body('consultationType').optional().isString().trim(),
    body('requestedDate').optional().isISO8601().toDate(),
    body('additionalComments').optional().isString().trim().isLength({ max: 1000 })
  ],
  validate,
  consultationController.createConsultation
);

// Admin-only routes - require authentication
router.get('/', adminAuth, consultationController.getAllConsultations);
router.get(
  '/:id',
  adminAuth,
  [param('id').isMongoId()],
  validate,
  consultationController.getConsultation
);
router.put(
  '/:id',
  adminAuth,
  [param('id').isMongoId()],
  validate,
  consultationController.updateConsultation
);

// Public routes with validation
router.post(
  '/:id/preview',
  [param('id').isMongoId()],
  validate,
  consultationController.generatePreview
);

// AI Assistant - rate limited in server.js
router.post(
  '/ai/chat',
  [body('message').isString().trim().notEmpty().isLength({ max: 500 })],
  validate,
  consultationController.aiAssistant
);

module.exports = router;
