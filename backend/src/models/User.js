const { query } = require('../config/db');

/**
 * User model — thin data-access layer over the `users` table.
 * Keeping raw SQL here (rather than a full ORM) so the rate/zone/assignment
 * modules that come later can reuse this same pattern consistently.
 */

const SAFE_FIELDS = `
  id, full_name, email, phone, role, is_email_verified, is_active,
  current_zone_id, current_latitude, current_longitude, is_available,
  max_concurrent_orders, created_at, updated_at
`;

async function createUser({ fullName, email, phone, passwordHash, role = 'customer' }) {
  const { rows } = await query(
    `INSERT INTO users (full_name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${SAFE_FIELDS}`,
    [fullName, email.toLowerCase().trim(), phone, passwordHash, role]
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(`SELECT ${SAFE_FIELDS} FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function markEmailVerified(userId) {
  await query(`UPDATE users SET is_email_verified = TRUE WHERE id = $1`, [userId]);
}

async function updatePassword(userId, passwordHash) {
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId]);
}

async function setAgentAvailability(userId, isAvailable) {
  const { rows } = await query(
    `UPDATE users SET is_available = $1
     WHERE id = $2 AND role = 'delivery_agent'
     RETURNING ${SAFE_FIELDS}`,
    [isAvailable, userId]
  );
  return rows[0] || null;
}

async function updateAgentLocation(userId, latitude, longitude, zoneId) {
  const { rows } = await query(
    `UPDATE users
     SET current_latitude = $1, current_longitude = $2, current_zone_id = $3
     WHERE id = $4 AND role = 'delivery_agent'
     RETURNING ${SAFE_FIELDS}`,
    [latitude, longitude, zoneId, userId]
  );
  return rows[0] || null;
}

async function listByRole(role) {
  const { rows } = await query(`SELECT ${SAFE_FIELDS} FROM users WHERE role = $1 ORDER BY created_at DESC`, [role]);
  return rows;
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  markEmailVerified,
  updatePassword,
  setAgentAvailability,
  updateAgentLocation,
  listByRole,
};
