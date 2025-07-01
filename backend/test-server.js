const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'MUN Website Test Server is running',
    timestamp: new Date().toISOString(),
    mode: 'test-mode-no-database'
  });
});

// Serve the main HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/homepage.html'));
});

app.get('/contact_us', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contact_us.html'));
});

app.get('/learn', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/learn.html'));
});

app.get('/signin_signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/signin_signup.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Mock API endpoints for testing
app.post('/api/contact', (req, res) => {
  res.json({
    success: true,
    message: 'Contact form submitted successfully (test mode)',
    data: {
      token: Date.now(),
      timestamp: new Date().toISOString()
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'User registered successfully (test mode)',
    data: {
      token: 'test-jwt-token',
      user: { email: req.body.email }
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'User logged in successfully (test mode)',
    data: {
      token: 'test-jwt-token',
      user: { email: req.body.email }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test Server running on port ${PORT}`);
  console.log(`🌐 Environment: test-mode-no-database`);
  console.log(`📋 Available routes:`);
  console.log(`   - GET / - Homepage`);
  console.log(`   - GET /contact_us - Contact form`);
  console.log(`   - GET /learn - Learn more page`);
  console.log(`   - GET /signin_signup - Authentication page`);
  console.log(`   - GET /dashboard - User dashboard`);
  console.log(`   - POST /api/contact - Contact form (mock)`);
  console.log(`   - POST /api/auth/register - Registration (mock)`);
  console.log(`   - POST /api/auth/login - Login (mock)`);
  console.log(`   - GET /health - Health check`);
  console.log(`\n⚠️  This is a test server without database functionality`);
  console.log(`📧 Email notifications are disabled in test mode`);
  console.log(`🔐 Authentication is mocked in test mode`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 