const { query } = require('../config/db');
const Order = require('../models/Order');

async function listAssignedOrders(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT * FROM orders WHERE assigned_agent_id = $1 ORDER BY updated_at DESC`,
      [req.user.id]
    );
    return res.json({ orders: rows });
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // Picked Up, In Transit, Out for Delivery, Delivered, Failed
    
    // Ensure agent is assigned to this order
    const { rows: orderRows } = await query(`SELECT * FROM orders WHERE id = $1`, [id]);
    if (orderRows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = orderRows[0];
    if (order.assigned_agent_id !== req.user.id) {
      return res.status(403).json({ error: 'Not assigned to this order' });
    }
    
    // Valid status progression can be enforced here.
    const validStatuses = ['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status update' });
    }
    
    // For failed deliveries, we might unassign the agent if we want auto-assign to pick it up later, 
    // or just leave it 'Failed' for customer to reschedule. Spec says: "Failed delivery -> customer notified -> can reschedule -> agent reassigned".
    // We leave it assigned but marked Failed. Customer rescheduling will reset it.

    const { rows: updated } = await query(
      `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    
    await Order.addStatusHistory(id, status, req.user.id, notes);
    
    // Trigger Email Notification (Module 6 hooks here)
    // We'll call this async and let it run
    const { sendStatusUpdateEmail } = require('../services/emailService');
    const User = require('../models/User');
    const customer = await User.findById(order.customer_id);
    if (customer) {
      sendStatusUpdateEmail(customer, updated[0]).catch(e => console.error('Email failed', e));
    }

    return res.json({ message: 'Order status updated', order: updated[0] });
  } catch (err) {
    next(err);
  }
}

// Reschedule flow (Customer hits this)
async function rescheduleOrder(req, res, next) {
  try {
    const { id } = req.params;
    
    const { rows: orderRows } = await query(`SELECT * FROM orders WHERE id = $1`, [id]);
    if (orderRows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = orderRows[0];
    if (order.customer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    if (order.status !== 'Failed') {
      return res.status(400).json({ error: 'Only failed orders can be rescheduled' });
    }
    
    // Reset to Pending and remove agent
    const { rows } = await query(
      `UPDATE orders SET status = 'Pending', assigned_agent_id = NULL, updated_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );
    
    await Order.addStatusHistory(id, 'Pending', req.user.id, 'Customer requested reschedule');
    
    return res.json({ message: 'Order rescheduled. Waiting for agent assignment.', order: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAssignedOrders,
  updateOrderStatus,
  rescheduleOrder
};
