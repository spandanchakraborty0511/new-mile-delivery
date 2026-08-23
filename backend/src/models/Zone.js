const { query } = require('../config/db');

async function createZone(name) {
  const { rows } = await query(
    `INSERT INTO zones (name) VALUES ($1) RETURNING *`,
    [name]
  );
  return rows[0];
}

async function listZones() {
  const { rows } = await query(`SELECT * FROM zones ORDER BY name ASC`);
  return rows;
}

async function getZoneById(id) {
  const { rows } = await query(`SELECT * FROM zones WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function deleteZone(id) {
  const { rowCount } = await query(`DELETE FROM zones WHERE id = $1`, [id]);
  return rowCount > 0;
}

async function addPincodeToZone(zoneId, pincode) {
  const { rows } = await query(
    `INSERT INTO pincodes (pincode, zone_id) VALUES ($1, $2)
     ON CONFLICT (pincode) DO UPDATE SET zone_id = $2
     RETURNING *`,
    [pincode, zoneId]
  );
  return rows[0];
}

async function removePincode(pincode) {
  const { rowCount } = await query(`DELETE FROM pincodes WHERE pincode = $1`, [pincode]);
  return rowCount > 0;
}

async function listPincodesByZone(zoneId) {
  const { rows } = await query(`SELECT pincode FROM pincodes WHERE zone_id = $1`, [zoneId]);
  return rows.map(r => r.pincode);
}

module.exports = {
  createZone,
  listZones,
  getZoneById,
  deleteZone,
  addPincodeToZone,
  removePincode,
  listPincodesByZone,
};
