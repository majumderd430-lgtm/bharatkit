#!/usr/bin/env node
/**
 * BharatKit Setup Script
 * Run: node scripts/setup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🚀 BharatKit Setup\n');

// Check .env exists
if (!fs.existsSync(path.join(__dirname, '../.env'))) {
  console.log('📋 Creating .env from .env.example...');
  fs.copyFileSync(
    path.join(__dirname, '../.env.example'),
    path.join(__dirname, '../.env')
  );
  console.log('✅ .env created. Please update DATABASE_URL and other variables.\n');
} else {
  console.log('✅ .env already exists\n');
}

// Check node_modules
if (!fs.existsSync(path.join(__dirname, '../node_modules'))) {
  console.log('📦 Installing backend dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  console.log('✅ Backend dependencies installed\n');
} else {
  console.log('✅ Backend dependencies already installed\n');
}

// Check dashboard node_modules
if (!fs.existsSync(path.join(__dirname, '../dashboard/node_modules'))) {
  console.log('📦 Installing dashboard dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, '../dashboard'), stdio: 'inherit' });
  console.log('✅ Dashboard dependencies installed\n');
} else {
  console.log('✅ Dashboard dependencies already installed\n');
}

// Generate Prisma client
console.log('🗄️  Generating Prisma client...');
try {
  execSync('npx prisma generate --schema=prisma/schema.prisma', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
  console.log('✅ Prisma client generated\n');
} catch (e) {
  console.error('❌ Prisma generate failed:', e.message);
}

// Create logs directory
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
  console.log('✅ Logs directory created\n');
}

console.log(`
✨ Setup complete!

Next steps:
1. Update .env with your database credentials
2. Run database migrations: npm run db:migrate
3. Start the API server: npm run dev
4. Start the dashboard: cd dashboard && npm run dev

API will be available at: http://localhost:3000
Dashboard will be available at: http://localhost:5173/dashboard
Health check: http://localhost:3000/health
Sandbox test data: http://localhost:3000/sandbox/test-data
`);
