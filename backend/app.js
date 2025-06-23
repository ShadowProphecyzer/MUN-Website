// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Routes placeholders (to be implemented)
app.use('/api/auth', require('./routes/authRoutes'));
// Similarly:
// app.use('/api/conferences', require('./routes/conferenceRoutes'));
// app.use('/api/people', require('./routes/peopleRoutes'));
// app.use('/api/notes', require('./routes/notesRoutes'));
// app.use('/api/voting', require('./routes/votingRoutes'));
// app.use('/api/amendments', require('./routes/amendmentsRoutes'));
// app.use('/api/contributions', require('./routes/contributionsRoutes'));

// Default route
app.get('/', (req, res) => {
  res.send('MUN Backend API is running');
});

module.exports = app;
