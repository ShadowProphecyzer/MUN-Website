const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
require('dotenv').config({ path: './config.env' });

const contactRoutes = require('./routes/contact');
const authRoutes = require('./routes/auth');
const emailService = require('./services/emailService');
const conferenceRoutes = require('./routes/conference');
const participantsRoutes = require('./routes/participants');
const participantsV2Routes = require('./routes/participantsV2');
const userCommitteesRoutes = require('./routes/userCommittees');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});
app.set('io', io);
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

// CORS configuration - Allow all origins for hosting
app.use(cors({
  origin: true, // Allow all origins for hosting
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Serve conference.html for /conference.html (must be above static middleware)
app.get('/conference.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/conference.html'));
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/conference', conferenceRoutes);
app.use('/api/participants', participantsRoutes);
app.use('/api/participantsV2', participantsV2Routes);
app.use('/api/user-committees', userCommitteesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'MUN Website Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/profile.html'));
});

app.get('/my_committees', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/my_committees.html'));
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
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// Socket.IO connection
io.on('connection', (socket) => {
  // Join a conference room
  socket.on('joinConference', (conferenceCode, userId) => {
    socket.join(`conference_${conferenceCode}`);
    if (userId) {
      socket.join(`conference_${conferenceCode}_user_${userId}`);
    }
  });
  // Optionally handle disconnects, etc.
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database: mun_website');
    console.log('📁 Collections: users, contacts');
    
    // Test email service connection
    await emailService.testConnection();
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 Email notifications will be sent to: ${process.env.EMAIL_USER}`);
    console.log(`🔐 JWT authentication enabled`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📋 Available routes:`);
    console.log(`   - POST /api/auth/register - User registration`);
    console.log(`   - POST /api/auth/login - User login`);
    console.log(`   - POST /api/contact - Contact form submission`);
    console.log(`   - GET /api/auth/check - Check authentication status`);
  });
};

startServer();

const getDelegateIds = async (conferenceCode) => {
  // Fetch all delegates for the conference
  const db = require('./services/conferenceDb').getConferenceDb(conferenceCode);
  const Conference = db.models.Conference;
  const conf = await Conference.findOne({ code: conferenceCode });
  if (!conf) return [];
  return conf.people.filter(p => p.role === 'Delegate').map(p => p._id.toString());
};

app.use('/conferences', express.static('conferences'));