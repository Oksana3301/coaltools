import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

export async function GET() {
  const results: any = {
    prismaAvailable: false,
    models: {}
  }

  const prisma = getPrismaClient()

  if (!prisma) {
    return NextResponse.json({
      success: false,
      error: 'Prisma client is null',
      results
    })
  }

  results.prismaAvailable = true

  // Test each model
  const modelsToTest = [
    { name: 'kasKecilExpense', query: () => prisma.kasKecilExpense.count() },
    { name: 'kasBesarTransaction', query: () => prisma.kasBesarTransaction.count() },
    { name: 'employee', query: () => prisma.employee.count() },
    { name: 'buyer', query: () => prisma.buyer.count() },
    { name: 'payComponent', query: () => prisma.payComponent.count() },
    { name: 'payrollRun', query: () => prisma.payrollRun.count() },
    { name: 'user', query: () => prisma.user.count() },
  ]

  for (const model of modelsToTest) {
    try {
      const count = await model.query()
      results.models[model.name] = {
        status: 'success',
        count
      }
    } catch (error) {
      results.models[model.name] = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  return NextResponse.json({
    success: true,
    results
  })
}
