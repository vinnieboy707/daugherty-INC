const SocialMediaConnection = require('../models/SocialMediaConnection');

// Get all social media connections
exports.getAllConnections = async (req, res) => {
  try {
    // Don't include access tokens in response
    const connections = await SocialMediaConnection.find().sort({ platform: 1 });
    res.json({ success: true, data: connections });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single connection
exports.getConnection = async (req, res) => {
  try {
    const { platform } = req.params;
    const connection = await SocialMediaConnection.findOne({ platform });
    
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    res.json({ success: true, data: connection });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create or update connection
exports.updateConnection = async (req, res) => {
  try {
    const { platform } = req.params;
    
    // Whitelist allowed fields
    const allowedFields = [
      'username',
      'profileUrl',
      'isConnected',
      'autoSync',
      'syncFrequency',
      'isEnabled',
      'settings',
      'accessToken',
      'refreshToken',
      'tokenExpiry'
    ];
    
    const updateData = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updateData[field] = req.body[field];
      }
    });

    updateData.updatedAt = Date.now();
    
    if (updateData.isConnected && !updateData.connectedAt) {
      updateData.connectedAt = Date.now();
    }

    const connection = await SocialMediaConnection.findOneAndUpdate(
      { platform },
      updateData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: connection, message: 'Connection updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Disconnect social media
exports.disconnectConnection = async (req, res) => {
  try {
    const { platform } = req.params;
    
    const connection = await SocialMediaConnection.findOneAndUpdate(
      { platform },
      {
        isConnected: false,
        accessToken: '',
        refreshToken: '',
        tokenExpiry: null,
        lastSync: null,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    res.json({ success: true, data: connection, message: 'Disconnected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Sync connection (update stats, fetch new content)
exports.syncConnection = async (req, res) => {
  try {
    const { platform } = req.params;
    
    const connection = await SocialMediaConnection.findOne({ platform }).select('+accessToken');
    
    if (!connection || !connection.isConnected) {
      return res.status(400).json({ success: false, error: 'Connection not active' });
    }

    // Placeholder for actual sync logic
    // In production, this would:
    // 1. Use the access token to call the platform's API
    // 2. Fetch latest posts, photos, stats
    // 3. Update the database with new content
    // 4. For Google Photos: fetch albums and photos
    
    connection.lastSync = Date.now();
    connection.updatedAt = Date.now();
    
    // Simulate stats update
    if (platform === 'google_photos') {
      connection.stats = {
        ...connection.stats,
        posts: Math.floor(Math.random() * 1000), // Number of photos
        lastPostDate: new Date()
      };
    } else {
      connection.stats = {
        followers: connection.stats.followers || Math.floor(Math.random() * 10000),
        posts: connection.stats.posts || Math.floor(Math.random() * 500),
        lastPostDate: new Date()
      };
    }
    
    await connection.save();

    // Remove sensitive data from response
    const response = connection.toObject();
    delete response.accessToken;
    delete response.refreshToken;

    res.json({ 
      success: true, 
      data: response,
      message: `${platform} synced successfully. In production, this would fetch real data from the platform API.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Initialize default connections
exports.initializeConnections = async (req, res) => {
  try {
    const platforms = [
      { platform: 'instagram', displayName: 'Instagram' },
      { platform: 'facebook', displayName: 'Facebook' },
      { platform: 'twitter', displayName: 'Twitter / X' },
      { platform: 'tiktok', displayName: 'TikTok' },
      { platform: 'pinterest', displayName: 'Pinterest' },
      { platform: 'youtube', displayName: 'YouTube' },
      { platform: 'google_photos', displayName: 'Google Photos' }
    ];

    const promises = platforms.map(({ platform, displayName }) =>
      SocialMediaConnection.findOneAndUpdate(
        { platform },
        { displayName },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    );

    const connections = await Promise.all(promises);
    
    res.json({ 
      success: true, 
      data: connections,
      message: 'Social media connections initialized' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Import photos from Google Photos to portfolio
exports.importGooglePhotos = async (req, res) => {
  try {
    const { photoIds } = req.body; // Array of photo IDs to import
    
    const connection = await SocialMediaConnection.findOne({ platform: 'google_photos' });
    
    if (!connection || !connection.isConnected) {
      return res.status(400).json({ success: false, error: 'Google Photos not connected' });
    }

    // Placeholder for actual import logic
    // In production, this would:
    // 1. Use Google Photos API to fetch photo data
    // 2. Download photos to local storage
    // 3. Create Portfolio entries for each photo
    // 4. Return the imported portfolio items

    res.json({ 
      success: true, 
      message: `Import initiated for ${photoIds?.length || 0} photos. In production, this would download photos from Google Photos and add them to the portfolio.`,
      photosToImport: photoIds?.length || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
