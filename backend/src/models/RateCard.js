const { query } = require('../config/db');

async function setRateCard(sourceZoneId, destinationZoneId, orderType, baseFee, perKgRate) {
  const { rows } = await query(
    `INSERT INTO rate_cards (source_zone_id, destination_zone_id, order_type, base_fee, per_kg_rate)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (source_zone_id, destination_zone_id, order_type)
     DO UPDATE SET base_fee = EXCLUDED.base_fee, per_kg_rate = EXCLUDED.per_kg_rate, updated_at = now()
     RETURNING *`,
    [sourceZoneId, destinationZoneId, orderType, baseFee, perKgRate]
  );
  return rows[0];
}

async function getRateCard(sourceZoneId, destinationZoneId, orderType) {
  const { rows } = await query(
    `SELECT * FROM rate_cards WHERE source_zone_id = $1 AND destination_zone_id = $2 AND order_type = $3`,
    [sourceZoneId, destinationZoneId, orderType]
  );
  return rows[0] || null;
}

async function listRateCards() {
  const { rows } = await query(
    `SELECT r.*, s.name as source_zone_name, d.name as destination_zone_name 
     FROM rate_cards r
     JOIN zones s ON r.source_zone_id = s.id
     JOIN zones d ON r.destination_zone_id = d.id
     ORDER BY s.name ASC, d.name ASC, r.order_type ASC`
  );
  return rows;
}

async function deleteRateCard(id) {
  const { rowCount } = await query(`DELETE FROM rate_cards WHERE id = $1`, [id]);
  return rowCount > 0;
}

async function getCodSurcharge(orderType) {
  const { rows } = await query(`SELECT surcharge_amount FROM cod_surcharges WHERE order_type = $1`, [orderType]);
  return rows[0] ? parseFloat(rows[0].surcharge_amount) : 0;
}

async function setCodSurcharge(orderType, surchargeAmount) {
  const { rows } = await query(
    `INSERT INTO cod_surcharges (order_type, surcharge_amount)
     VALUES ($1, $2)
     ON CONFLICT (order_type)
     DO UPDATE SET surcharge_amount = EXCLUDED.surcharge_amount, updated_at = now()
     RETURNING *`,
    [orderType, surchargeAmount]
  );
  return rows[0];
}

async function listCodSurcharges() {
  const { rows } = await query(`SELECT * FROM cod_surcharges`);
  return rows;
}

module.exports = {
  setRateCard,
  getRateCard,
  listRateCards,
  deleteRateCard,
  getCodSurcharge,
  setCodSurcharge,
  listCodSurcharges,
};
