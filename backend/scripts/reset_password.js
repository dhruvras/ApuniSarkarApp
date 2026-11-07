import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const email = process.argv[2];
const newPassword = process.argv[3] || 'Citizen@123';

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI missing from .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB Atlas\n');

    if (!email) {
      console.log('--- RECENT REGISTERED USERS IN DATABASE ---');
      const users = await User.find().sort({ createdAt: -1 }).limit(10).select('-password');
      if (users.length === 0) {
        console.log('No users found in database.');
      } else {
        users.forEach((u, i) => {
          console.log(`[${i + 1}] Name: ${u.firstName} ${u.lastName} | Email: ${u.email} | Mobile: ${u.mobile} | District: ${u.district}`);
        });
      }
      console.log('\nTo reset password for any user, run:');
      console.log('  node reset_password.js <email> [newPassword]\n');
      process.exit(0);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.error(`❌ User not found with email: ${normalizedEmail}`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    console.log('========================================');
    console.log('✅ PASSWORD RESET SUCCESSFUL');
    console.log(`👤 User:     ${user.firstName} ${user.lastName}`);
    console.log(`📧 User ID:  ${user.email}`);
    console.log(`🔒 Password: ${newPassword}`);
    console.log('========================================\n');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();

