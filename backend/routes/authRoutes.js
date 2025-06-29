// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, getMe, makeAdmin, getGodEmail } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { canMakeAdmin } = require('../middleware/roleMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/god-email', getGodEmail);
router.patch('/:userId/make-admin', protect, canMakeAdmin, makeAdmin);

module.exports = router;
