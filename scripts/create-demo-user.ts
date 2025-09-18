import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createDemoUser() {
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' }
    })

    if (existingUser) {
      console.log('Demo user already exists:', existingUser)
      return existingUser
    }

    // Create demo user
    const demoUser = await prisma.user.create({
      data: {
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'demo123',
        role: 'ADMIN'
      }
    })

    console.log('Demo user created successfully:', demoUser)
    return demoUser
  } catch (error) {
    console.error('Error creating demo user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createDemoUser()
    .then(() => {
      console.log('✅ Demo user setup complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Demo user setup failed:', error)
      process.exit(1)
    })
}

export { createDemoUser }
