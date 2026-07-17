const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../src/models/User');
const Role = require('../src/models/Role');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-blogging';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000
    });
    console.log('Connected to MongoDB');

    // Seed default roles
    console.log('Seeding default roles...');
    await Role.seedDefaultRoles();
    console.log('Default roles created');

    // Create admin user if it doesn't exist
    console.log('Creating admin user...');
    const adminExists = await User.findOne({ email: 'admin@blog.com' });

    if (!adminExists) {
      const adminUser = new User({
        email: 'admin@blog.com',
        passwordHash: 'Admin@2024!',
        name: 'Admin User',
        role: 'admin',
        isActive: true
      });
      await adminUser.save();
      console.log('Admin user created: admin@blog.com / Admin@2024!');
    } else {
      console.log('Admin user already exists');
    }

    // Create test users
    console.log('Creating test users...');
    const testUsers = [
      { email: 'editor@blog.com', name: 'Editor User', role: 'editor', password: 'Editor@2024!' },
      { email: 'reviewer@blog.com', name: 'Reviewer User', role: 'reviewer', password: 'Reviewer@2024!' },
      { email: 'viewer@blog.com', name: 'Viewer User', role: 'viewer', password: 'Viewer@2024!' }
    ];

    for (const testUser of testUsers) {
      const userExists = await User.findOne({ email: testUser.email });
      if (!userExists) {
        const user = new User({
          email: testUser.email,
          passwordHash: testUser.password,
          name: testUser.name,
          role: testUser.role,
          isActive: true
        });
        await user.save();
        console.log(`Test user created: ${testUser.email} / ${testUser.password}`);
      }
    }

    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
