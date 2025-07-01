const { body, validationResult } = require('express-validator');

const contactFormValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .isLength({ min: 5, max: 254 })
    .withMessage('Email must be between 5 and 254 characters')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Please enter a valid email format'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
    .matches(/^[a-zA-Z0-9\s.,!?@#$%^&*()_+\-=\[\]{};':"\\|<>\/\n\r\t]+$/)
    .withMessage('Message contains invalid characters')
    .custom((value) => {
      // Check for spam indicators
      const spamWords = ['buy now', 'click here', 'free money', 'lottery', 'viagra', 'casino'];
      const lowerValue = value.toLowerCase();
      const spamCount = spamWords.filter(word => lowerValue.includes(word)).length;
      
      if (spamCount > 2) {
        throw new Error('Message appears to be spam');
      }
      return true;
    })
];

const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .custom(async (value) => {
      const User = require('../models/User');
      const existingUser = await User.findOne({ username: value });
      if (existingUser) {
        throw new Error('Username already exists');
      }
      return true;
    }),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .isLength({ min: 5, max: 254 })
    .withMessage('Email must be between 5 and 254 characters')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Please enter a valid email format')
    .custom(async (value) => {
      const User = require('../models/User');
      const existingUser = await User.findOne({ email: value.toLowerCase() });
      if (existingUser) {
        throw new Error('Email already registered');
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Email or username is required')
    .isLength({ min: 3, max: 254 })
    .withMessage('Identifier must be between 3 and 254 characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty')
];

const conferenceValidation = [
  body('conferenceName')
    .trim()
    .notEmpty()
    .withMessage('Conference name is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Conference name must be between 1 and 1000 characters')
    .matches(/^[a-zA-Z0-9\s.,!?@#$%^&*()_+\-=\[\]{};':"\\|<>\/\n\r\t]+$/)
    .withMessage('Conference name contains invalid characters'),
  
  body('committeeName')
    .trim()
    .notEmpty()
    .withMessage('Committee name is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Committee name must be between 1 and 1000 characters')
    .matches(/^[a-zA-Z0-9\s.,!?@#$%^&*()_+\-=\[\]{};':"\\|<>\/\n\r\t]+$/)
    .withMessage('Committee name contains invalid characters')
    .custom(async (value) => {
      const Conference = require('../models/Conference');
      const existingConference = await Conference.isCommitteeNameTaken(value);
      if (existingConference) {
        throw new Error('Committee name already exists');
      }
      return true;
    }),
  
  body('committeeIssue')
    .trim()
    .notEmpty()
    .withMessage('Committee issue is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Committee issue must be between 1 and 1000 characters')
    .matches(/^[a-zA-Z0-9\s.,!?@#$%^&*()_+\-=\[\]{};':"\\|<>\/\n\r\t]+$/)
    .withMessage('Committee issue contains invalid characters')
];

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

function validateAmendmentInput(req, res, next) {
  const { resolutionNumber, clauseNumber, subclause, subSubClause, type, content } = req.body;
  if (!resolutionNumber || !Number.isInteger(resolutionNumber) || resolutionNumber <= 0) {
    return res.status(400).json({ error: 'Resolution number must be a positive integer' });
  }
  if (!clauseNumber || !Number.isInteger(clauseNumber) || clauseNumber <= 0) {
    return res.status(400).json({ error: 'Clause number must be a positive integer' });
  }
  if (subclause && !/^[A-Z]$/.test(subclause)) {
    return res.status(400).json({ error: 'Subclause must be a single uppercase letter (A-Z)' });
  }
  if (subSubClause && subSubClause !== 'N/A' && !/^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(subSubClause)) {
    return res.status(400).json({ error: 'Sub-sub clause must be a valid Roman numeral or "N/A"' });
  }
  if (!['Add','Modify','Strike'].includes(type)) {
    return res.status(400).json({ error: 'Type must be Add, Modify, or Strike' });
  }
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }
  next();
}

function validateStatusInput(req, res, next) {
  const { status } = req.body;
  if (!['in-debate','passed','rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  next();
}

module.exports = {
  contactFormValidation,
  registerValidation,
  loginValidation,
  conferenceValidation,
  validateRequest,
  validateAmendmentInput,
  validateStatusInput
}; 