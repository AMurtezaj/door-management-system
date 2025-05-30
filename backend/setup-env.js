const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file with default database configuration...');
  
  const envContent = `# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=door_management
DB_PORT=5432

# JWT Configuration
JWT_SECRET=lindidoors_supersecretkey

# Server Configuration
PORT=3001
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('');
  console.log('⚠️  IMPORTANT: Please update the .env file with your actual database credentials:');
  console.log('   - DB_USER: Your database username');
  console.log('   - DB_PASS: Your database password');
  console.log('   - DB_NAME: Your database name (default: door_management)');
  console.log('   - DB_HOST: Your database host (default: localhost)');
  console.log('   - DB_PORT: Your database port (default: 5432 for PostgreSQL)');
  console.log('');
  console.log('📁 File location:', envPath);
} else {
  console.log('✅ .env file already exists!');
  console.log('📁 File location:', envPath);
  console.log('');
  console.log('Current configuration:');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && key.startsWith('DB_')) {
      console.log(`   ${key}: ${value || '(not set)'}`);
    }
  });
} 