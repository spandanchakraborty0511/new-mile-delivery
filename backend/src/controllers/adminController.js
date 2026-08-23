const { query } = require('../config/db');
const assignmentService = require('../services/assignmentService');
const Order = require('../models/Order');

async function listAllOrders(req, res, next) {
  try {
    const { status, zoneId, agentId } = req.query;
    let baseQuery = `SELECT * FROM orders WHERE 1=1`;
    const params = [];
    
    if (status) {
      params.push(status);
      baseQuery += ` AND status = $${params.length}`;
    }
    if (zoneId) {
      params.push(zoneId);
      baseQuery += ` AND pickup_zone_id = $${params.length}`;
    }
    if (agentId) {
      params.push(agentId);
      baseQuery += ` AND assigned_agent_id = $${params.length}`;
    }
    
    baseQuery += ` ORDER BY created_at DESC`;
    
    const { rows } = await query(baseQuery, params);
    return res.json({ orders: rows });
  } catch (err) {
    next(err);
  }
}

async function autoAssignOrder(req, res, next) {
  try {
    const { id } = req.params;
    const agent = await assignmentService.autoAssign(id);
    await Order.addStatusHistory(id, 'Assigned', req.user.id, `Auto-assigned to agent ${agent.full_name}`);
    return res.json({ message: 'Order auto-assigned successfully', agent });
  } catch (err) {
    if (err.message.includes('No available agents') || err.message.includes('not found')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

async function manualAssignOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    const order = await assignmentService.manualAssign(id, agentId);
    await Order.addStatusHistory(id, 'Assigned', req.user.id, `Manually assigned to agent ${agentId}`);
    return res.json({ message: 'Order manually assigned', order });
  } catch (err) {
    next(err);
  }
}

async function overrideOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const { rows } = await query(
      `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    await Order.addStatusHistory(id, status, req.user.id, `Admin override: ${notes || ''}`);
    return res.json({ message: 'Order status overridden', order: rows[0] });
  } catch (err) {
    next(err);
  }
}

const { hashPassword } = require('../utils/hash');
const User = require('../models/User');

async function listAgents(req, res, next) {
  try {
    const agents = await User.listByRole('delivery_agent');
    return res.json({ agents });
  } catch (err) {
    next(err);
  }
}

async function createAgent(req, res, next) {
  try {
    const { fullName, email, phone, password } = req.body;
    
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const agent = await User.createUser({ fullName, email, phone, passwordHash, role: 'delivery_agent' });
    
    return res.status(201).json({ message: 'Agent created successfully', agent });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAllOrders,
  autoAssignOrder,
  manualAssignOrder,
  overrideOrderStatus,
  listAgents,
  createAgent
};
