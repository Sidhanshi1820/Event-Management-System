// Promotes an existing user to admin by email.
// Usage: node scripts/create-admin.js <email>

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/event_management';

const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/create-admin.js <email>');
  console.log('Example: node scripts/create-admin.js admin@example.com');
  console.log('\nThe user must already be registered. This script promotes them to admin.');
  process.exit(1);
}

async function createAdmin() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected');

  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (!user) {
    console.error(
      `✗ User not found: no account exists with email "${email}". Register an account first, then run this script again.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  user.role = 'admin';
  await user.save();

  console.log(`✓ Success: ${user.email} (${user.fullName}) is now an admin (role=admin).`);
}

createAdmin()
  .then(async () => {
    await mongoose.disconnect();
    console.log('✓ Disconnected. Done.');
  })
  .catch(async (err) => {
    console.error('✗ Failed to promote user:', err.message);
    try {
      await mongoose.disconnect();
    } catch (disconnectErr) {
      // ignore disconnect errors on failure path
    }
    process.exit(1);
  });
