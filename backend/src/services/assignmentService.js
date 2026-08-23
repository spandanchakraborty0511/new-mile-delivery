const { query } = require('../config/db');

// Calculate risk score for an order
async function calculateRiskScore(order) {
  let score = 0;
  
  // Rule 1: COD has higher failure risk
  if (order.payment_type === 'COD') {
    score += 30;
  }
  
  // Rule 2: Package size (volumetric weight > 10kg is higher risk)
  if (order.volumetric_weight_kg > 10) {
    score += 20;
  }
  
  // Rule 3: Customer history (if they have previous failed orders)
  const { rows: history } = await query(
    `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed 
     FROM orders WHERE customer_id = $1 AND id != $2 AND status IN ('Delivered', 'Failed')`,
    [order.customer_id, order.id]
  );
  if (history.length > 0 && history[0].total > 0) {
    const failRate = parseFloat(history[0].failed) / parseFloat(history[0].total);
    score += (failRate * 50); // Up to 50 points based on fail rate
  }
  
  // Cap at 100
  return Math.min(Math.round(score), 100);
}

// Update the order's risk score in the DB
async function assessAndSaveRiskScore(orderId) {
  const { rows } = await query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  if (rows.length === 0) return null;
  const order = rows[0];
  
  const score = await calculateRiskScore(order);
  await query(`UPDATE orders SET risk_score = $1 WHERE id = $2`, [score, orderId]);
  return score;
}

// Auto-assign order to the best agent
async function autoAssign(orderId) {
  const { rows } = await query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  if (rows.length === 0) throw new Error('Order not found');
  const order = rows[0];

  const score = order.risk_score || await assessAndSaveRiskScore(orderId);
  const isHighRisk = score > 50;

  // We need an available agent in the pickup zone who has < max_concurrent_orders
  // We determine currently active orders per agent
  let agentsQuery = `
    SELECT u.*, 
      (SELECT COUNT(*) FROM orders o WHERE o.assigned_agent_id = u.id AND o.status NOT IN ('Delivered', 'Failed')) as active_orders,
      (SELECT COUNT(*) FROM orders o WHERE o.assigned_agent_id = u.id AND o.status = 'Delivered') as success_count,
      (SELECT COUNT(*) FROM orders o WHERE o.assigned_agent_id = u.id AND o.status IN ('Delivered', 'Failed')) as total_completed
    FROM users u
    WHERE u.role = 'delivery_agent' 
      AND u.is_available = TRUE 
      AND u.current_zone_id = $1
  `;
  
  const { rows: agents } = await query(agentsQuery, [order.pickup_zone_id]);
  
  // Filter out agents who are at capacity
  let eligibleAgents = agents.filter(a => parseInt(a.active_orders) < a.max_concurrent_orders);
  
  if (eligibleAgents.length === 0) {
    throw new Error('No available agents in the pickup zone at this time');
  }
  
  let selectedAgent = null;
  
  if (isHighRisk) {
    // Pick agent with best completion rate in general
    selectedAgent = eligibleAgents.sort((a, b) => {
      const rateA = a.total_completed > 0 ? a.success_count / a.total_completed : 0.5; // default to 50% if new
      const rateB = b.total_completed > 0 ? b.success_count / b.total_completed : 0.5;
      return rateB - rateA; // descending
    })[0];
  } else {
    // Naive nearest available (since we just track current_latitude/longitude, we simulate "nearest" by least active orders for load balancing here if coordinates aren't fully populated)
    // In a real spatial DB, we'd use ST_Distance
    selectedAgent = eligibleAgents.sort((a, b) => {
      // Sort by active orders ascending (least loaded first)
      return parseInt(a.active_orders) - parseInt(b.active_orders);
    })[0];
  }

  // Assign it
  await query(`UPDATE orders SET assigned_agent_id = $1, status = 'Assigned', updated_at = now() WHERE id = $2`, [selectedAgent.id, orderId]);
  
  return selectedAgent;
}

// Manual assignment
async function manualAssign(orderId, agentId) {
  const { rows } = await query(
    `UPDATE orders SET assigned_agent_id = $1, status = 'Assigned', updated_at = now() WHERE id = $2 RETURNING *`,
    [agentId, orderId]
  );
  if (rows.length === 0) throw new Error('Order not found');
  return rows[0];
}

module.exports = {
  assessAndSaveRiskScore,
  autoAssign,
  manualAssign
};
