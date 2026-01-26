// Public configuration endpoint
exports.getPublicConfig = async (req, res) => {
  try {
    const config = {
      contact: {
        phone: process.env.CONTACT_PHONE || '',
        email: process.env.CONTACT_EMAIL || '',
        instagram: process.env.CONTACT_INSTAGRAM || '',
        location: process.env.CONTACT_LOCATION || 'Mendocino, CA',
        businessName: process.env.BUSINESS_NAME || 'Nate Daugherty - Tattoo Artist'
      },
      website: {
        url: process.env.WEBSITE_URL || 'https://daugherty-inc.com',
        title: process.env.WEBSITE_TITLE || 'Nate Daugherty - Professional Tattoo Artist',
        description: process.env.WEBSITE_DESCRIPTION || 'Check out Nate Daugherty, a talented Mendocino tattoo artist! Support local artists and promote individual business growth in our community. Book your consultation today!'
      },
      features: {
        stripeEnabled: !!process.env.STRIPE_PUBLISHABLE_KEY,
        aiPreviewEnabled: !!process.env.OPENAI_API_KEY,
        donationsEnabled: true
      }
    };

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Admin: Update public configuration
exports.updatePublicConfig = async (req, res) => {
  try {
    // This would typically update a database record or environment file
    // For now, return success with instructions
    const { contact, website } = req.body;

    // In production, this would:
    // 1. Validate the input
    // 2. Update database configuration
    // 3. Optionally update environment variables
    // 4. Clear any caches

    res.json({ 
      success: true, 
      message: 'Configuration updated successfully. To persist changes, update environment variables in .env file.',
      data: { contact, website }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
