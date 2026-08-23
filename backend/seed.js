const { query, pool } = require('./src/config/db');
const { hashPassword } = require('./src/utils/hash');

(async () => {
  try {
    const hash = await hashPassword('admin123');
    await query("INSERT INTO users (full_name, email, phone, password_hash, role) VALUES ('Admin', 'admin@example.com', '1234567890', $1, 'admin') ON CONFLICT DO NOTHING", [hash]);
    console.log('Admin seeded!');
    await pool.end();
  } catch(e) {
    console.error(e);
  }
})();
