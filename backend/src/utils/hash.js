const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Generates a random opaque token for email-verify / password-reset / refresh flows.
 * Returns both the raw token (sent to the user, e.g. in an email link) and its
 * SHA-256 hash (what we store in the DB) — so a leaked DB never exposes usable tokens.
 */
function generateOpaqueToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = { hashPassword, comparePassword, generateOpaqueToken, hashToken };
