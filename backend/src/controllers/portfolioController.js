const Portfolio = require('../models/Portfolio');
const fs = require('fs').promises;
const path = require('path');

// Get all portfolio images
exports.getAllPortfolio = async (req, res) => {
  try {
    const { visibleOnly } = req.query;
    const filter = visibleOnly === 'true' ? { isVisible: true } : {};
    
    const portfolio = await Portfolio.find(filter).sort({ displayOrder: 1, uploadedAt: -1 });
    res.json({ success: true, data: portfolio });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Upload portfolio image
exports.uploadPortfolio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { description, tags } = req.body;
    
    // Get the highest displayOrder
    const maxOrder = await Portfolio.findOne().sort({ displayOrder: -1 });
    const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

    const portfolio = new Portfolio({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      url: `/uploads/portfolio/${req.file.filename}`,
      displayOrder,
      description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await portfolio.save();
    res.status(201).json({ success: true, data: portfolio });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update portfolio item
exports.updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;

    // Whitelist allowed fields to prevent updating protected or unintended fields
    const allowedFields = ['description', 'tags', 'isVisible', 'displayOrder'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === 'tags') {
          const tagsValue = req.body.tags;
          if (Array.isArray(tagsValue)) {
            updates.tags = tagsValue.map(tag => String(tag).trim()).filter(Boolean);
          } else if (typeof tagsValue === 'string') {
            updates.tags = tagsValue
              .split(',')
              .map(tag => tag.trim())
              .filter(Boolean);
          }
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided for update' });
    }

    const portfolio = await Portfolio.findByIdAndUpdate(id, updates, { new: true });
    
    if (!portfolio) {
      return res.status(404).json({ success: false, error: 'Portfolio item not found' });
    }

    res.json({ success: true, data: portfolio });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update display order
exports.updateDisplayOrder = async (req, res) => {
  try {
    const { orders } = req.body; // Array of { id, displayOrder }

    const updatePromises = orders.map(({ id, displayOrder }) =>
      Portfolio.findByIdAndUpdate(id, { displayOrder })
    );

    await Promise.all(updatePromises);
    res.json({ success: true, message: 'Display order updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete portfolio item
exports.deletePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await Portfolio.findByIdAndDelete(id);
    
    if (!portfolio) {
      return res.status(404).json({ success: false, error: 'Portfolio item not found' });
    }

    // Delete file from disk using async operations
    try {
      await fs.unlink(portfolio.path);
    } catch (error) {
      // Log error but don't fail the request if file doesn't exist
      console.error('Error deleting file:', error.message);
    }

    res.json({ success: true, message: 'Portfolio item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
