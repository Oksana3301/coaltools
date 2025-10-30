const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
})

async function test() {
  try {
    console.log('Testing KasBesarTransaction query...')
    const result = await prisma.kasBesarTransaction.findMany({
      take: 1
    })
    console.log('✅ Query successful')
    console.log('Result count:', result.length)
    if (result.length > 0) {
      console.log('First record fields:', Object.keys(result[0]))
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    if (error.code) console.error('Error code:', error.code)
  } finally {
    await prisma.$disconnect()
  }
}

test()
