const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  handleValidation,
} = require('../utils/validators');

// Stricter limiter on login/register to blunt brute-force and enumeration attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, registerRules, handleValidation, authController.register);
router.post('/login', authLimiter, loginRules, handleValidation, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authLimiter, forgotPasswordRules, handleValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordRules, handleValidation, authController.resetPassword);
router.get('/me', authenticate, authController.me);

module.exports = router;
