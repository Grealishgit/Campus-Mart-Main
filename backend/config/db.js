const { Pool } = require('pg');
require('dotenv').config();

console.log('🔧 Database configuration:');
console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  Port: ${process.env.DB_PORT || 5432}`);
console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
console.log(`  Database: ${process.env.DB_NAME || 'campus_mart'}`);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'campus_mart',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err.message);
  process.exit(-1);
});

module.exports = pool;