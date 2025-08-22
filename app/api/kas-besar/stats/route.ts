import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Ambil statistik kas besar
export async function GET(request: NextRequest) {
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

    const [
      totalTransactions,
      totalAmount,
      statusCounts,
      monthlyData,
      topVendors,
      recentTransactions
    ] = await Promise.all([
      // Total transaksi
      prisma.kasBesarExpense.count({ where }),
      
      // Total amount
      prisma.kasBesarExpense.aggregate({
        where,
        _sum: { total: true }
      }),
      
      // Count by status
      prisma.kasBesarExpense.groupBy({
        by: ['status'],
        where,
        _count: { status: true }
      }),
      
      // Monthly data (last 6 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as count,
          SUM(total) as amount
        FROM kas_besar_expenses 
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        ${userId ? `AND "createdBy" = '${userId}'` : ''}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `,
      
      // Top vendors
      prisma.kasBesarExpense.groupBy({
        by: ['vendorNama'],
        where,
        _sum: { total: true },
        _count: { vendorNama: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5
      }),
      
      // Recent transactions
      prisma.kasBesarExpense.findMany({
        where,
        include: {
          creator: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    const stats = {
      totalTransactions,
      totalAmount: totalAmount._sum.total || 0,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {} as Record<string, number>),
      monthlyData,
      topVendors: topVendors.map(vendor => ({
        name: vendor.vendorNama,
        totalAmount: vendor._sum.total || 0,
        transactionCount: vendor._count.vendorNama
      })),
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        barang: tx.barang,
        total: tx.total,
        status: tx.status,
        createdAt: tx.createdAt,
        creatorName: tx.creator.name
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
