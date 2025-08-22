import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createDemoUsers() {
  try {
    console.log('🌱 Creating demo users...')

    // Demo users data
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
    ]

    for (const userData of demoUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        console.log(`✅ User already exists: ${userData.email}`)
        continue
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role
        }
      })

      console.log(`✅ Created user: ${userData.email} (${userData.role})`)
    }

    console.log('🎉 Demo users setup complete!')
    console.log('\n📋 Demo Accounts:')
    console.log('1. admin@example.com / Admin123! (Admin)')
    console.log('2. manager@example.com / Manager123! (Approver)')
    console.log('3. staff@example.com / Staff123! (User)')
    console.log('4. demo@example.com / Demo123! (Admin)')

  } catch (error) {
    console.error('❌ Error creating demo users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createDemoUsers()
    .then(() => {
      console.log('✅ Demo users setup complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Demo users setup failed:', error)
      process.exit(1)
    })
}

export { createDemoUsers }
