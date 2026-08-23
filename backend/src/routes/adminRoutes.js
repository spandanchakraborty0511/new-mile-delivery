const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/orders', adminController.listAllOrders);
router.post('/orders/:id/auto-assign', adminController.autoAssignOrder);
router.post('/orders/:id/assign', adminController.manualAssignOrder);
router.post('/orders/:id/override', adminController.overrideOrderStatus);

router.get('/agents', adminController.listAgents);
router.post('/agents', adminController.createAgent);

module.exports = router;
