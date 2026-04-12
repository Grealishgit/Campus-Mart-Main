const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔧 Database configuration:');
console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  Port: ${process.env.DB_PORT || 5432}`);
console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
console.log(`  Database: ${process.env.DB_NAME || 'campus_mart'}`);

const adminPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'postgres', // Connect to default postgres db to create new db
});

const dbName = process.env.DB_NAME || 'campus_mart';

async function setupDatabase() {
  try {
    console.log('🔧 Starting database setup...');

    // Test connection first
    console.log('🔌 Testing database connection...');
    await adminPool.query('SELECT NOW()');
    console.log('✅ Connection successful');

    // Step 1: Create database if it doesn't exist
    console.log(`📦 Creating database '${dbName}' if it doesn't exist...`);
    await adminPool.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Database '${dbName}' created successfully`);
  } catch (err) {
    if (err.code === '42P04') {
      console.log(`✅ Database '${dbName}' already exists`);
    } else {
      console.error('❌ Connection error:', err.message);
      console.error('Error code:', err.code);
      process.exit(1);
    }
  }

  try {
    // Step 2: Connect to the new database and run schema
    const dbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: dbName,
    });

    const schemaPath = path.join(__dirname, 'config', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Running schema.sql...');
    await dbPool.query(schema);
    console.log('✅ Schema created successfully');

    await dbPool.end();
  } catch (err) {
    console.error('❌ Error running schema:', err.message);
    process.exit(1);
  }

  await adminPool.end();
  console.log('✨ Database setup complete!');
  process.exit(0);
}

setupDatabase();
