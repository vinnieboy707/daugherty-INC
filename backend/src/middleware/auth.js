const basicAuth = require('express-basic-auth');

// Simple admin authentication middleware using basic auth
// In production, consider using JWT tokens with proper user management
const adminAuth = basicAuth({
  users: {
    [process.env.ADMIN_USERNAME || 'admin']: process.env.ADMIN_PASSWORD || 'CHANGE_THIS_PASSWORD'
  },
  challenge: true,
  realm: 'Admin Area',
  unauthorizedResponse: (req) => {
    return {
      success: false,
      error: 'Authentication required. Please provide valid admin credentials.'
    };
  }
});

module.exports = { adminAuth };
