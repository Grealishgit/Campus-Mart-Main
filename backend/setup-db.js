const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('  Database configuration:');
console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  Port: ${process.env.DB_PORT || 5432}`);
console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
console.log(`  Database: ${process.env.DB_NAME || 'campus_mart'}`);

const adminPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'postgres',
});

const dbName = process.env.DB_NAME || 'campus_mart';

const DEMO_USERS = [
  {
    name: 'Campus Admin',
    email: 'admin@campusmart.ac.ke',
    password: 'Admin@123',
    role: 'admin',
    faculty: 'Administration',
    is_verified: true,
  },
  {
    name: 'Marketplace Admin',
    email: 'superadmin@campusmart.ac.ke',
    password: 'SuperAdmin@123',
    role: 'admin',
    faculty: 'Operations',
    is_verified: true,
  },
  {
    name: 'Demo Student',
    email: 'student@students.campusmart.ac.ke',
    password: 'Student@123',
    role: 'student',
    faculty: 'Engineering',
    is_verified: true,
  },
];

async function seedDemoUsers(dbPool) {
  console.log('Seeding demo users...');

  for (const user of DEMO_USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await dbPool.query(
      `INSERT INTO users (name, email, password, role, faculty, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         password = EXCLUDED.password,
         role = EXCLUDED.role,
         faculty = EXCLUDED.faculty,
         is_verified = EXCLUDED.is_verified,
         updated_at = NOW()`,
      [
        user.name,
        user.email.toLowerCase(),
        hashedPassword,
        user.role,
        user.faculty,
        user.is_verified,
      ]
    );
  }

  console.log('Demo users seeded successfully');
}

async function setupDatabase() {
  try {
    console.log('Starting database setup...');

    console.log('🔌 Testing database connection...');
    await adminPool.query('SELECT NOW()');
    console.log('Connection successful');

    console.log(`Creating database '${dbName}' if it doesn't exist...`);
    await adminPool.query(`CREATE DATABASE ${dbName}`);
    console.log(`Database '${dbName}' created successfully`);
  } catch (err) {
    if (err.code === '42P04') {
      console.log(`Database '${dbName}' already exists`);
    } else {
      console.error('Connection error:', err.message);
      console.error('   Error code:', err.code);
      process.exit(1);
    }
  }

  try {
    const dbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: dbName,
    });

    const schemaPath = path.join(__dirname, 'config', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running schema.sql...');
    await dbPool.query(schema);
    console.log('Schema created successfully');

    await seedDemoUsers(dbPool);
    await dbPool.end();
  } catch (err) {
    console.error('Error running schema:', err.message);
    process.exit(1);
  }

  await adminPool.end();
  console.log('Database setup complete!');
  process.exit(0);
}

setupDatabase();