const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { registerValidation, loginValidation, validateRequest } = require('../middleware/validation');
const rateLimiterMiddleware = require('../middleware/rateLimiter');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// POST /api/auth/register - User registration
router.post('/register', 
  rateLimiterMiddleware,
  registerValidation,
  validateRequest,
  async (req, res) => {
    console.log('[DEBUG] Entered /api/auth/register endpoint');
    try {
      const { username, email, password } = req.body;
      console.log('[DEBUG] Registration request - username:', username, 'email:', email);
      
      // Create new user
      const user = new User({
        username,
        email,
        password
      });
      console.log('[DEBUG] Attempting to save new user:', { username, email });
      await user.save();
      console.log('[DEBUG] User saved successfully:', user._id);
      
      // Generate JWT token
      const token = generateToken(user._id, user.username, user.role);
      console.log('[DEBUG] JWT token generated for user:', user._id);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            role: user.role
          }
        }
      });
      
    } catch (error) {
      console.error('[DEBUG] Registration error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const message = field === 'username' ? 'Username already exists' : 'Email already registered';
        console.log('[DEBUG] Duplicate field error:', field);
        return res.status(409).json({
          success: false,
          message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  }
);

// POST /api/auth/login - User login
router.post('/login',
  rateLimiterMiddleware,
  loginValidation,
  validateRequest,
  async (req, res) => {
    console.log('[DEBUG] Entered /api/auth/login endpoint');
    try {
      const { identifier, password } = req.body;
      console.log('[DEBUG] Login request - identifier:', identifier);
      
      // Find user by email or username
      const user = await User.findByEmailOrUsername(identifier);
      console.log('[DEBUG] User found for login:', user ? { id: user._id, username: user.username, email: user.email } : 'Not found');
      
      if (!user) {
        console.log('[DEBUG] User not found for login');
        return res.status(401).json({
          success: false,
          message: 'Invalid email/username or password'
        });
      }
      
      // Check if account is locked
      if (user.isLocked()) {
        const lockTime = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
        console.log('[DEBUG] Account is locked, lock time remaining:', lockTime, 'minutes');
        return res.status(423).json({
          success: false,
          message: `Account is locked. Try again in ${lockTime} minutes.`
        });
      }
      
      // Check if account is active
      if (!user.isActive) {
        console.log('[DEBUG] Account is deactivated');
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }
      
      // Verify password
      console.log('[DEBUG] About to verify password');
      const isPasswordValid = await user.comparePassword(password);
      console.log('[DEBUG] Password validation result:', isPasswordValid);
      
      if (!isPasswordValid) {
        // Increment login attempts
        await user.incLoginAttempts();
        console.log('[DEBUG] Password invalid, incremented login attempts');
        
        const remainingAttempts = 5 - (user.loginAttempts + 1);
        const message = remainingAttempts > 0 
          ? `Invalid email/username or password. ${remainingAttempts} attempts remaining.`
          : 'Account locked due to too many failed attempts. Try again in 2 hours.';
        
        return res.status(401).json({
          success: false,
          message
        });
      }
      
      // Reset login attempts on successful login
      await User.resetLoginAttempts(user.username);
      console.log('[DEBUG] Password valid, reset login attempts');
      
      // Generate JWT token
      const token = generateToken(user._id, user.username, user.role);
      console.log('[DEBUG] JWT token generated for successful login:', user._id);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            role: user.role
          }
        }
      });
      
    } catch (error) {
      console.error('[DEBUG] Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  }
);

// POST /api/auth/logout - User logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User information retrieved',
    data: {
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        displayName: req.user.displayName,
        role: req.user.role,
        lastLogin: req.user.lastLogin
      }
    }
  });
});

// Inline isAuthenticated middleware for /api/auth/check
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

// GET /api/auth/check - Check if user is authenticated
router.get('/check', isAuthenticated);

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', authenticateToken, (req, res) => {
  try {
    // Generate new token
    const newToken = generateToken(req.user._id, req.user.username, req.user.role);
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        user: {
          id: req.user._id,
          username: req.user.username,
          email: req.user.email,
          displayName: req.user.displayName,
          role: req.user.role
        }
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

module.exports = router; 