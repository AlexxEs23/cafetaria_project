import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { TransactionStatus } from '@prisma/client'

// GET /api/reports/daily - Get detailed daily report
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only KASIR, PENGURUS, and MITRA can access reports
    if (token.role !== 'KASIR' && token.role !== 'PENGURUS' && token.role !== 'MITRA') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    
    // Use provided date or today
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0)
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59)

    // For MITRA, get their items first
    let mitraItemIds: number[] = []
    if (token.role === 'MITRA') {
      const mitraItems = await prisma.item.findMany({
        where: {
          mitraId: Number(token.sub),
        },
        select: {
          id: true,
        },
      })
      mitraItemIds = mitraItems.map(item => item.id)

      // If mitra has no items, return empty report
      if (mitraItemIds.length === 0) {
        return NextResponse.json({
          date: targetDate.toISOString().split('T')[0],
          dayName: targetDate.toLocaleDateString('id-ID', { weekday: 'long' }),
          totalSales: 0,
          transactionCount: 0,
          averageTransaction: 0,
          transactions: [],
          topItems: [],
          hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
            hour: `${String(i).padStart(2, '0')}:00`,
            count: 0,
            sales: 0,
          })),
        })
      }
    }

    // Build where clause for transactions
    const whereClause: {
      createdAt: { gte: Date; lte: Date }
      status: { in: TransactionStatus[] }
      details?: { some: { itemId: { in: number[] } } }
    } = {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: [TransactionStatus.APPROVED, TransactionStatus.COMPLETED],
      },
    }

    // For MITRA, only get transactions that include their items
    if (token.role === 'MITRA') {
      whereClause.details = {
        some: {
          itemId: {
            in: mitraItemIds,
          },
        },
      }
    }

    // Get all transactions for the day
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        details: {
          include: {
            item: {
              select: {
                namaBarang: true,
              },
            },
          },
          // For MITRA, only include their items in details
          ...(token.role === 'MITRA' && {
            where: {
              itemId: {
                in: mitraItemIds,
              },
            },
          }),
        },
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // For MITRA, filter out transactions with no details (after filtering)
    const filteredTransactions = token.role === 'MITRA' 
      ? transactions.filter(t => t.details.length > 0)
      : transactions

    // Calculate totals (only from mitra's items for MITRA role)
    const totalSales = filteredTransactions.reduce((sum, t) => {
      const itemTotal = t.details.reduce((detailSum, detail) => detailSum + detail.subtotal, 0)
      return sum + itemTotal
    }, 0)
    const transactionCount = filteredTransactions.length

    // Calculate top selling items
    const itemSales: { [key: string]: { quantity: number; revenue: number } } = {}
    
    filteredTransactions.forEach(transaction => {
      transaction.details.forEach(detail => {
        const itemName = detail.item.namaBarang
        if (!itemSales[itemName]) {
          itemSales[itemName] = { quantity: 0, revenue: 0 }
        }
        itemSales[itemName].quantity += detail.jumlah
        itemSales[itemName].revenue += detail.subtotal
      })
    })

    const topItems = Object.entries(itemSales)
      .map(([itemName, data]) => ({
        itemName,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Hourly distribution
    const hourlyData: { [key: number]: { count: number; sales: number } } = {}
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { count: 0, sales: 0 }
    }

    filteredTransactions.forEach(transaction => {
      const hour = new Date(transaction.createdAt).getHours()
      const transactionTotal = transaction.details.reduce((sum, detail) => sum + detail.subtotal, 0)
      hourlyData[hour].count += 1
      hourlyData[hour].sales += transactionTotal
    })

    const hourlyDistribution = Object.entries(hourlyData).map(([hour, data]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      count: data.count,
      sales: data.sales,
    }))

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      dayName: targetDate.toLocaleDateString('id-ID', { weekday: 'long' }),
      totalSales,
      transactionCount,
      averageTransaction: transactionCount > 0 ? totalSales / transactionCount : 0,
      transactions: filteredTransactions.map(t => ({
        id: t.id,
        totalHarga: t.details.reduce((sum, detail) => sum + detail.subtotal, 0),
        status: t.status,
        createdAt: t.createdAt,
        customerName: t.customerName,
        customerLocation: t.customerLocation,
        user: t.user,
        details: t.details,
      })),
      topItems,
      hourlyDistribution,
    })
  } catch (error) {
    console.error('GET /api/reports/daily error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
