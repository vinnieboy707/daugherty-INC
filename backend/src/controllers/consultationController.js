const Consultation = require('../models/Consultation');

// Create new consultation request
exports.createConsultation = async (req, res) => {
  try {
    const consultationData = {
      ...req.body,
      referenceImages: [],
      selfieImage: null,
      previewImages: []
    };

    // Handle file uploads from multer
    if (req.files) {
      if (req.files.referenceImages) {
        consultationData.referenceImages = req.files.referenceImages.map(file => ({
          filename: file.filename,
          path: file.path,
          url: `/uploads/consultations/${file.filename}`
        }));
      }
      
      if (req.files.selfie && req.files.selfie[0]) {
        const selfie = req.files.selfie[0];
        consultationData.selfieImage = {
          filename: selfie.filename,
          path: selfie.path,
          url: `/uploads/consultations/${selfie.filename}`
        };
      }
    }

    const consultation = new Consultation(consultationData);
    await consultation.save();

    res.status(201).json({ 
      success: true, 
      data: consultation,
      message: 'Consultation request submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all consultations
exports.getAllConsultations = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const consultations = await Consultation.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: consultations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single consultation
exports.getConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    res.json({ success: true, data: consultation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update consultation
exports.updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    if (!consultation) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    res.json({ success: true, data: consultation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Generate AI preview (placeholder - would integrate with actual AI service)
exports.generatePreview = async (req, res) => {
  try {
    const { id } = req.params;
    const consultation = await Consultation.findById(id);

    if (!consultation) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    if (!consultation.selfieImage) {
      return res.status(400).json({ success: false, error: 'No selfie image uploaded' });
    }

    // Placeholder for AI integration
    // In production, this would call an AI service to generate the preview
    const previewImage = {
      filename: `preview-${Date.now()}.jpg`,
      path: '/uploads/consultations/preview-placeholder.jpg',
      url: `/uploads/consultations/preview-${Date.now()}.jpg`,
      createdAt: new Date()
    };

    consultation.previewImages.push(previewImage);
    await consultation.save();

    res.json({ 
      success: true, 
      data: consultation,
      message: 'Preview generated successfully. Note: This is a simulated preview.',
      disclaimer: 'This is a preview only and does not guarantee the final tattoo will look identical.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// AI Assistant endpoint (placeholder for AI chat functionality)
exports.aiAssistant = async (req, res) => {
  try {
    const { message, consultationId } = req.body;

    // Placeholder AI response
    // In production, this would integrate with OpenAI or similar service
    const responses = {
      'schedule': 'I can help you schedule a consultation! What date works best for you?',
      'pricing': 'Pricing varies based on size and complexity. VIP services start at $500. Would you like to discuss your specific tattoo idea?',
      'placement': 'Popular placements include arms, back, chest, and legs. Where are you considering?',
      'pain': 'Pain levels vary by placement. Areas with more muscle or fat are generally less painful.',
      'default': 'I\'m here to help with your tattoo consultation! You can ask me about scheduling, pricing, placement, pain levels, or any other questions.'
    };

    const responseKey = Object.keys(responses).find(key => 
      message.toLowerCase().includes(key)
    ) || 'default';

    res.json({ 
      success: true, 
      message: responses[responseKey],
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
