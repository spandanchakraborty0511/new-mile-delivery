const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { authenticate, authorize } = require('../middleware/auth');

// Customer reschedule route (should technically be in orderRoutes but placing here for grouping related logic, or I'll move it to orderRoutes later)
// Let's add it to orderRoutes as well, but here we can just expose agent endpoints

router.use(authenticate, authorize('delivery_agent'));

router.get('/orders', agentController.listAssignedOrders);
router.post('/orders/:id/status', agentController.updateOrderStatus);

module.exports = router;
