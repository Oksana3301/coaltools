import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'


// Use shared prisma client from lib/db
const prisma = getPrismaClient()


// GET - Ambil statistik kas besar
export async function GET(request: NextRequest) {
  try {
    // Check if prisma client is available
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

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
      totalTransactions,
      totalAmount,
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
        _sum: { total: true }
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
          total: true
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Top vendors
      prisma.kasBesarTransaction.groupBy({
        by: ['vendorNama'],
        where,
        _sum: { total: true },
        _count: { vendorNama: true },
        orderBy: { _sum: { total: 'desc' } },
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
      acc[month].amount += tx.total || 0
      return acc
    }, {} as Record<string, { count: number, amount: number }>)

    const stats = {
      totalTransactions,
      totalAmount: totalAmount._sum.total || 0,
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
        name: vendor.vendorNama,
        totalAmount: vendor._sum.total || 0,
        transactionCount: vendor._count.vendorNama
      })),
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        barang: tx.barang,
        vendorNama: tx.vendorNama,
        total: tx.total,
        status: tx.status,
        createdAt: tx.createdAt
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
