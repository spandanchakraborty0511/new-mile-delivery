const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  orderRules,
  quoteRules,
  handleValidation,
} = require('../utils/validators');

// Public route to get a quote (maybe requires authentication, let's make it authenticated)
router.post('/quote', authenticate, quoteRules, handleValidation, orderController.getQuote);

// Customer routes
router.post('/', authenticate, authorize('customer'), orderRules, handleValidation, orderController.createOrder);
router.get('/', authenticate, orderController.listMyOrders);
router.get('/:id', authenticate, orderController.getOrderDetails);

const { rescheduleOrder } = require('../controllers/agentController'); // or move to orderController

router.post('/:id/reschedule', authenticate, rescheduleOrder);

module.exports = router;
