require('dotenv').config();
const { query, pool } = require('./src/config/db');
const { hashPassword } = require('./src/utils/hash');

async function seedAdmin() {
  try {
    const hash = await hashPassword('admin123');
    
    // Check if admin exists
    const { rows } = await query(`SELECT * FROM users WHERE email = 'admin@example.com'`);
    if (rows.length > 0) {
      console.log('Admin user already exists! (admin@example.com / admin123)');
    } else {
      await query(
        `INSERT INTO users (full_name, email, phone, password_hash, role) 
         VALUES ('System Admin', 'admin@example.com', '1234567890', $1, 'admin')`,
        [hash]
      );
      console.log('Successfully created admin user: admin@example.com / admin123');
    }
  } catch (err) {
    console.error('Error seeding admin:', err.message);
    console.log('\nMake sure your PostgreSQL database is running and your .env credentials are correct.');
  } finally {
    await pool.end();
  }
}

seedAdmin();
