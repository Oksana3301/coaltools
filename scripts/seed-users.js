#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('🌱 Seeding demo users...\n');

  try {
    // Demo users with different roles
    const demoUsers = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin123!',
        role: 'admin'
      },
      {
        name: 'Manager User', 
        email: 'manager@example.com',
        password: 'Manager123!',
        role: 'approver'
      },
      {
        name: 'Staff User',
        email: 'staff@example.com', 
        password: 'Staff123!',
        role: 'user'
      },
      {
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'Demo123!',
        role: 'admin'
      }
    ];

    for (const userData of demoUsers) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (existingUser) {
          console.log(`⏭️  User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Create user
        const user = await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role
          }
        });

        console.log(`✅ Created user: ${user.email} (${user.role})`);

      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log('\n🎉 User seeding completed!');
    console.log('\n📋 Demo Accounts Created:');
    console.log('👑 Admin: admin@example.com / Admin123!');  
    console.log('🏢 Manager: manager@example.com / Manager123!');
    console.log('👤 Staff: staff@example.com / Staff123!');
    console.log('🧪 Demo: demo@example.com / Demo123!');

  } catch (error) {
    console.error('❌ Error during user seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedUsers();
