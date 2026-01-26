require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');

// Import routes
const portfolioRoutes = require('./routes/portfolio');
const consultationRoutes = require('./routes/consultations');
const reviewRoutes = require('./routes/reviews');
const availabilityRoutes = require('./routes/availability');
const socialMediaRoutes = require('./routes/socialMedia');
const donationRoutes = require('./routes/donations');
const paymentSettingsRoutes = require('./routes/paymentSettings');
const configRoutes = require('./routes/config');
const achRoutes = require('./routes/ach');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration - support multiple origins
const allowedOrigins = (process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [process.env.FRONTEND_URL || 'http://localhost:5173']
).map(origin => origin.trim()).filter(origin => origin.length > 0);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' }
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter limit for submission endpoints
  message: { success: false, error: 'Too many submissions, please try again later.' }
});

app.use('/api/', limiter);
app.use('/api/consultations', strictLimiter);
app.use('/api/reviews', strictLimiter);
app.use('/api/consultations/ai/chat', strictLimiter);
app.use('/api/ach', strictLimiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/payment-settings', paymentSettingsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/ach', achRoutes);

// Welcome route
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Daugherty Inc. API',
    version: '2.0.0',
    endpoints: {
      portfolio: '/api/portfolio',
      consultations: '/api/consultations',
      reviews: '/api/reviews',
      availability: '/api/availability',
      donations: '/api/donations',
      paymentSettings: '/api/payment-settings',
      ach: '/api/ach',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size too large. Maximum size is 10MB.'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Too many files uploaded.'
    });
  }
  
  // General errors
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   Daugherty Inc. API Server          ║
║   Server running on port ${PORT}        ║
║   Environment: ${process.env.NODE_ENV || 'development'}             ║
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = app;
