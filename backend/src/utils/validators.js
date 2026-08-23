const { body, param, validationResult } = require('express-validator');

const registerRules = [
  body('fullName').trim().isLength({ min: 2, max: 150 }).withMessage('Full name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').matches(/^\+?[0-9]{10,15}$/).withMessage('A valid phone number is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number'),
  // role is optional; only admins are allowed to set it to something other than 'customer' (enforced in controller)
  body('role').optional().isIn(['customer', 'delivery_agent', 'admin']),
];

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordRules = [body('email').isEmail().normalizeEmail()];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const zoneRules = [
  body('name').trim().notEmpty().withMessage('Zone name is required').isLength({ max: 100 }),
];

const pincodeRules = [
  body('pincode').trim().notEmpty().withMessage('Pincode is required').isLength({ max: 20 }),
];

const rateCardRules = [
  body('sourceZoneId').isUUID().withMessage('Valid sourceZoneId is required'),
  body('destinationZoneId').isUUID().withMessage('Valid destinationZoneId is required'),
  body('orderType').isIn(['B2B', 'B2C']).withMessage('orderType must be B2B or B2C'),
  body('baseFee').isFloat({ min: 0 }).withMessage('baseFee must be a positive number'),
  body('perKgRate').isFloat({ min: 0 }).withMessage('perKgRate must be a positive number'),
];

const codSurchargeRules = [
  body('orderType').isIn(['B2B', 'B2C']).withMessage('orderType must be B2B or B2C'),
  body('surchargeAmount').isFloat({ min: 0 }).withMessage('surchargeAmount must be a positive number'),
];

const orderRules = [
  body('pickupAddress').notEmpty().withMessage('pickupAddress is required'),
  body('pickupPincode').notEmpty().withMessage('pickupPincode is required'),
  body('dropAddress').notEmpty().withMessage('dropAddress is required'),
  body('dropPincode').notEmpty().withMessage('dropPincode is required'),
  body('length').isFloat({ min: 0.1 }).withMessage('length must be positive'),
  body('width').isFloat({ min: 0.1 }).withMessage('width must be positive'),
  body('height').isFloat({ min: 0.1 }).withMessage('height must be positive'),
  body('actualWeight').isFloat({ min: 0.1 }).withMessage('actualWeight must be positive'),
  body('orderType').isIn(['B2B', 'B2C']).withMessage('orderType must be B2B or B2C'),
  body('paymentType').isIn(['Prepaid', 'COD']).withMessage('paymentType must be Prepaid or COD'),
];

const quoteRules = [
  body('pickupPincode').notEmpty().withMessage('pickupPincode is required'),
  body('dropPincode').notEmpty().withMessage('dropPincode is required'),
  body('length').isFloat({ min: 0.1 }).withMessage('length must be positive'),
  body('width').isFloat({ min: 0.1 }).withMessage('width must be positive'),
  body('height').isFloat({ min: 0.1 }).withMessage('height must be positive'),
  body('actualWeight').isFloat({ min: 0.1 }).withMessage('actualWeight must be positive'),
  body('orderType').isIn(['B2B', 'B2C']).withMessage('orderType must be B2B or B2C'),
  body('paymentType').isIn(['Prepaid', 'COD']).withMessage('paymentType must be Prepaid or COD'),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

module.exports = {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  zoneRules,
  pincodeRules,
  rateCardRules,
  codSurchargeRules,
  orderRules,
  quoteRules,
  handleValidation,
};
