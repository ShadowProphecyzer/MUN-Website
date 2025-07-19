const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Generate JWT token for a user
function generateToken(id, username, role) {
  console.log('[DEBUG] Generating JWT token for user:', { id, username, role });
  const token = jwt.sign({ id, username, role }, JWT_SECRET, { expiresIn: '7d' });
  console.log('[DEBUG] JWT token generated successfully');
  return token;
}

// Middleware to authenticate JWT token and attach user to req.user
async function authenticateToken(req, res, next) {
  console.log('[DEBUG] authenticateToken middleware called');
  const authHeader = req.headers['authorization'];
  console.log('[DEBUG] Authorization header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[DEBUG] No valid authorization header found');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  console.log('[DEBUG] Extracted token from header');
  
  try {
    console.log('[DEBUG] About to verify JWT token');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('[DEBUG] JWT token verified, decoded:', { id: decoded.id, username: decoded.username, role: decoded.role });
    
    console.log('[DEBUG] About to find user by ID:', decoded.id);
    const user = await User.findById(decoded.id);
    console.log('[DEBUG] User found:', user ? { id: user._id, username: user.username, email: user.email } : 'Not found');
    
    if (!user) {
      console.log('[DEBUG] User not found in database');
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    req.user = user;
    console.log('[DEBUG] User attached to request object');
    next();
  } catch (err) {
    console.error('[DEBUG] JWT verification error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Middleware to check if user is authenticated (for /api/auth/check)
async function isAuthenticated(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ success: true, authenticated: false });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(200).json({ success: true, authenticated: false });
    }
    res.status(200).json({ success: true, authenticated: true, user: {
      id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role
    }});
  } catch (err) {
    return res.status(200).json({ success: true, authenticated: false });
  }
}

// Middleware to require a specific role or roles
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient role' });
    }
    next();
  };
}

const requireAuth = authenticateToken;

module.exports = {
  generateToken,
  authenticateToken,
  isAuthenticated,
  requireRole,
  requireAuth
};
