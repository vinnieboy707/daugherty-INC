const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const upload = require('../config/upload');

// Consultation routes
router.post('/', 
  upload.fields([
    { name: 'referenceImages', maxCount: 5 },
    { name: 'selfie', maxCount: 1 }
  ]),
  consultationController.createConsultation
);

router.get('/', consultationController.getAllConsultations);
router.get('/:id', consultationController.getConsultation);
router.put('/:id', consultationController.updateConsultation);
router.post('/:id/preview', consultationController.generatePreview);

// AI Assistant
router.post('/ai/chat', consultationController.aiAssistant);

module.exports = router;
