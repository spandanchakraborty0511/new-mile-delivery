const { verifyAccessToken } = require('../config/jwt');
const User = require('../models/User');

/**
 * Verifies the Bearer access token and attaches the authenticated user to req.user.
 * Rejects if the user was deactivated after the token was issued (checked live,
 * not just trusted from the JWT payload — important since admins can deactivate
 * accounts and that should take effect immediately, not after token expiry).
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been deactivated' });
    }

    req.user = user; // { id, full_name, email, role, ... } — no password_hash, from SAFE_FIELDS
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid access token' });
  }
}

/**
 * Restricts a route to one or more roles.
 * Usage: router.get('/admin/orders', authenticate, authorize('admin'), handler)
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
