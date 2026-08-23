const User = require('../models/User');
const { query } = require('../config/db');
const { hashPassword, comparePassword, generateOpaqueToken, hashToken } = require('../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

/**
 * POST /api/auth/register
 * Public self-registration always creates a 'customer'. To create a
 * delivery_agent or admin, an authenticated admin must call
 * POST /api/admin/users instead (see adminController) — this route never
 * trusts a client-supplied role for privilege escalation.
 */
async function register(req, res, next) {
  try {
    const { fullName, email, phone, password } = req.body;

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.createUser({ fullName, email, phone, passwordHash, role: 'customer' });

    const { raw, hash } = generateOpaqueToken();
    await query(
      `INSERT INTO action_tokens (user_id, purpose, token_hash, expires_at)
       VALUES ($1, 'email_verify', $2, now() + interval '24 hours')`,
      [user.id, hash]
    );
    await sendVerificationEmail(user, raw);

    return res.status(201).json({
      message: 'Registered successfully. Please check your email to verify your account.',
      user,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Returns a short-lived access token + a longer-lived refresh token.
 * Refresh tokens are tracked (hashed) in DB so they can be revoked on logout.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'This account has been deactivated. Contact support.' });
    }

    const passwordMatches = await comparePassword(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + interval '30 days')`,
      [user.id, hashToken(refreshToken)]
    );

    delete user.password_hash;

    return res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 * Exchanges a valid, non-revoked refresh token for a new access token.
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken is required' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const tokenHash = hashToken(refreshToken);
    const { rows } = await query(
      `SELECT * FROM refresh_tokens
       WHERE user_id = $1 AND token_hash = $2 AND revoked = FALSE AND expires_at > now()`,
      [payload.sub, tokenHash]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token not recognized or already revoked' });
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.is_active) {
      return res.status(403).json({ error: 'Account unavailable' });
    }

    const accessToken = signAccessToken(user);
    return res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Revokes the given refresh token so it can no longer be exchanged.
 */
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query(`UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`, [hashToken(refreshToken)]);
    }
    return res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/verify-email?token=...
 */
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const tokenHash = hashToken(token);
    const { rows } = await query(
      `SELECT * FROM action_tokens
       WHERE token_hash = $1 AND purpose = 'email_verify' AND used = FALSE AND expires_at > now()`,
      [tokenHash]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }

    await query(`UPDATE action_tokens SET used = TRUE WHERE id = $1`, [rows[0].id]);
    await User.markEmailVerified(rows[0].user_id);

    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password
 * Always returns 200 with a generic message, even if the email doesn't
 * exist — prevents user enumeration via response differences.
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);

    if (user) {
      const { raw, hash } = generateOpaqueToken();
      await query(
        `INSERT INTO action_tokens (user_id, purpose, token_hash, expires_at)
         VALUES ($1, 'password_reset', $2, now() + interval '1 hour')`,
        [user.id, hash]
      );
      await sendPasswordResetEmail(user, raw);
    }

    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    const tokenHash = hashToken(token);

    const { rows } = await query(
      `SELECT * FROM action_tokens
       WHERE token_hash = $1 AND purpose = 'password_reset' AND used = FALSE AND expires_at > now()`,
      [tokenHash]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const passwordHash = await hashPassword(newPassword);
    await User.updatePassword(rows[0].user_id, passwordHash);
    await query(`UPDATE action_tokens SET used = TRUE WHERE id = $1`, [rows[0].id]);
    // Revoke all existing refresh tokens on password change — forces re-login everywhere
    await query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [rows[0].user_id]);

    return res.json({ message: 'Password reset successfully. Please log in again.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
async function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  me,
};
