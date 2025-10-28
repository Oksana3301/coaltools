import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Singleton pattern untuk Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// GET - Ambil statistik kas besar
export async function GET(request: NextRequest) {
    // prisma already initialized above,
        { status: 503 }
      )
    }

    
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}
    
    if (userId) {
      where.createdBy = userId
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Handle soft delete filter - exclude deleted records
    where.deletedAt = null

    const [
      jumlahTransactions,
      jumlahAmount,
      statusCounts,
      monthlyData,
      topVendors,
      recentTransactions
    ] = await Promise.all([
      // Total transaksi
      prisma.kasBesarTransaction.count({ where }),
      
      // Total amount
      prisma.kasBesarTransaction.aggregate({
        where,
        _sum: { jumlah: true }
      }),
      
      // Count by status
      prisma.kasBesarTransaction.groupBy({
        by: ['status'],
        where,
        _count: { status: true }
      }),
      
      // Monthly data (last 6 months) - simplified approach
      prisma.kasBesarTransaction.findMany({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) // 6 months ago
          }
        },
        select: {
          createdAt: true,
          jumlah: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Top vendors
      prisma.kasBesarTransaction.groupBy({
        by: ['kategori'],
        where,
        _sum: { jumlah: true },
        _count: { kategori: true },
        orderBy: { _sum: { jumlah: 'desc' } },
        take: 5
      }),
      
      // Recent transactions
      prisma.kasBesarTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    // Process monthly data
    const monthlyStats = monthlyData.reduce((acc, tx) => {
      const month = tx.createdAt.toISOString().substring(0, 7) // YYYY-MM format
      if (!acc[month]) {
        acc[month] = { count: 0, amount: 0 }
      }
      acc[month].count++
      acc[month].amount += tx.jumlah || 0
      return acc
    }, {} as Record<string, { count: number, amount: number }>)

    const stats = {
      jumlahTransactions,
      jumlahAmount: jumlahAmount._sum.jumlah || 0,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {} as Record<string, number>),
      monthlyData: Object.entries(monthlyStats).map(([month, data]) => ({
        month,
        count: data.count,
        amount: data.amount
      })),
      topVendors: topVendors.map(vendor => ({
        name: vendor.kategori,
        jumlahAmount: vendor._sum.jumlah || 0,
        transactionCount: vendor._count.kategori
      })),
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        deskripsi: tx.deskripsi,
        jumlah: tx.jumlah,
        status: tx.status,
        createdAt: tx.createdAt,
        creatorName: 'Unknown'
      }))
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil statistik' },
      { status: 500 }
    )
  }
}
