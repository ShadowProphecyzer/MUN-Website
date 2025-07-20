const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const emailService = require('../services/emailService');
const { contactFormValidation, validateRequest } = require('../middleware/validation');
const rateLimiterMiddleware = require('../middleware/rateLimiter');

// POST /api/contact - Submit contact form
router.post('/contact', 
  rateLimiterMiddleware,
  contactFormValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { email, message } = req.body;
      
      // Get client information
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      // Create new contact submission
      const contactData = {
        email,
        message,
        ipAddress,
        userAgent
      };
      
      const contact = new Contact(contactData);
      await contact.save();
      
      // Send email notification
      try {
        await emailService.sendContactNotification(contact);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
      
      res.status(201).json({
        success: true,
        message: 'Contact form submitted successfully',
        data: {
          token: contact.token,
          timestamp: contact.timestamp
        }
      });
      
    } catch (error) {
      console.error('Contact form submission error:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Duplicate submission detected. Please wait a moment before trying again.'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again later.'
      });
    }
  }
);

// GET /api/contact/health - Health check endpoint
router.get('/contact/health', (req, res) => {
  res.json({
    success: true,
    message: 'Contact API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 