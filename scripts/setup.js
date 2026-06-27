const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const pg = require('pg');

function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Failed to run: ${command}`);
    return false;
  }
}

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('Copying .env.example to .env...');
  fs.copyFileSync('.env.example', '.env');
}

console.log('\n======================================');
console.log('       POS System Database Setup      ');
console.log('======================================\n');

checkAndSetupPostgreSQL();

async function checkAndSetupPostgreSQL() {
  console.log('Testing PostgreSQL connection...');
  // Load env variables
  require('dotenv').config();
  let dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('✖ DATABASE_URL not found in .env');
    process.exit(1);
  }

  // Parse the connection URL to connect to the default 'postgres' database
  let defaultDbUrl = dbUrl;
  try {
    const urlObj = new URL(dbUrl.replace('postgresql://', 'http://').replace('postgres://', 'http://'));
    urlObj.pathname = '/postgres';
    defaultDbUrl = urlObj.toString().replace('http://', 'postgresql://');
  } catch (e) {
    defaultDbUrl = dbUrl.replace(/\/([^/?]+)(\?|$)/, '/postgres$2');
  }

  const pool = new pg.Pool({ connectionString: defaultDbUrl });
  try {
    const client = await pool.connect();
    console.log('✔ Successfully connected to PostgreSQL server.');
    
    // Check if 'pos_db' exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='pos_db'");
    if (res.rowCount === 0) {
      console.log("Database 'pos_db' does not exist. Creating it...");
      await client.query("CREATE DATABASE pos_db");
      console.log("✔ Database 'pos_db' created successfully.");
    } else {
      console.log("✔ Database 'pos_db' already exists.");
    }
    client.release();
    await pool.end();
    
    // Run migrations and seeds
    runPrismaCommands();
  } catch (err) {
    await pool.end();
    if (err.message.includes('password authentication failed') || err.message.includes('password is required')) {
      console.log('\n✖ PostgreSQL password authentication failed.');
      console.log('Please enter the password for your "postgres" database user.');
      
      const rlTemp = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rlTemp.question('Enter PostgreSQL Password: ', (password) => {
        rlTemp.close();
        
        // Update DATABASE_URL in .env
        let envContent = fs.readFileSync('.env', 'utf8');
        const newDbUrl = `postgresql://postgres:${password}@localhost:5432/pos_db?schema=public`;
        envContent = envContent.replace(/DATABASE_URL\s*=\s*".*"/g, `DATABASE_URL="${newDbUrl}"`);
        fs.writeFileSync('.env', envContent);
        
        console.log('✔ Updated .env with the new password.');
        process.env.DATABASE_URL = newDbUrl;
        
        // Retry connection
        setTimeout(checkAndSetupPostgreSQL, 1000);
      });
    } else if (err.code === 'ECONNREFUSED') {
      console.log('\n✖ Could not connect to PostgreSQL server on localhost:5432.');
      console.log('================================================================');
      console.log('👉 Please ensure that the PostgreSQL service is RUNNING.');
      console.log('👉 You can start it by right-clicking "start-postgres.bat"');
      console.log('   in your project folder and choosing "Run as administrator".');
      console.log('================================================================\n');
      
      const rlConnect = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rlConnect.question('Press Enter to retry connection after starting the service...', () => {
        rlConnect.close();
        checkAndSetupPostgreSQL();
      });
    } else {
      console.log('\n✖ Connection error:', err.message);
    }
  }
}

function runPrismaCommands() {
  console.log('\n--- Initializing Database Tables & Client ---');
  const isWindows = process.platform === 'win32';
  const prefix = isWindows ? 'cmd /c ' : '';
  
  const pushSuccess = runCommand(`${prefix}npx prisma db push --force-reset`);
  if (pushSuccess) {
    console.log('✔ Database schema pushed successfully.');
    
    // Seed
    console.log('\n--- Seeding Sample Data ---');
    const seedSuccess = runCommand(`${prefix}npx prisma db seed`);
    if (seedSuccess) {
      console.log('✔ Database seeded successfully.');
      console.log('\n======================================');
      console.log('🎉 Setup complete!');
      console.log('You can now run "start.bat" or "npm run dev" to start the project.');
      console.log('======================================');
    } else {
      console.log('✖ Failed to seed database.');
    }
  } else {
    console.log('✖ Failed to push database schema.');
  }
}
