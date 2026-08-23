const { query } = require('../config/db');

async function createOrder(data) {
  const {
    customerId, pickupAddress, pickupPincode, pickupZoneId,
    dropAddress, dropPincode, dropZoneId,
    length, width, height, actualWeight, volumetricWeight, chargeableWeight,
    orderType, paymentType,
    baseFee, perKgRate, weightCharge, codSurcharge, totalCharge
  } = data;

  const { rows } = await query(
    `INSERT INTO orders (
      customer_id, pickup_address, pickup_pincode, pickup_zone_id,
      drop_address, drop_pincode, drop_zone_id,
      package_length_cm, package_width_cm, package_height_cm,
      actual_weight_kg, volumetric_weight_kg, chargeable_weight_kg,
      order_type, payment_type, base_fee, per_kg_rate, weight_charge, cod_surcharge, total_charge
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
    ) RETURNING *`,
    [
      customerId, pickupAddress, pickupPincode, pickupZoneId,
      dropAddress, dropPincode, dropZoneId,
      length, width, height,
      actualWeight, volumetricWeight, chargeableWeight,
      orderType, paymentType, baseFee, perKgRate, weightCharge, codSurcharge, totalCharge
    ]
  );
  return rows[0];
}

async function getOrderById(id) {
  const { rows } = await query(`SELECT * FROM orders WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function getOrdersByCustomer(customerId) {
  const { rows } = await query(`SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`, [customerId]);
  return rows;
}

async function addStatusHistory(orderId, status, actorId, notes = '') {
  await query(
    `INSERT INTO order_status_history (order_id, status, actor_id, notes) VALUES ($1, $2, $3, $4)`,
    [orderId, status, actorId, notes]
  );
}

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByCustomer,
  addStatusHistory,
};
