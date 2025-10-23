import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { TransactionStatus } from '@prisma/client'

// GET /api/reports - Get sales reports with different periods
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
    const period = searchParams.get('period') || 'daily' // daily, monthly, yearly
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const now = new Date()
    let startDate: Date
    let endDate: Date
    let groupBy: 'day' | 'month' | 'year'

    // If custom date range is provided
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(endDateParam)
      endDate.setHours(23, 59, 59, 999)
      groupBy = 'day'
    } else {
      // Use predefined periods
      endDate = now
      switch (period) {
        case 'daily':
          // Last 7 days
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
          groupBy = 'day'
          break
        case 'monthly':
          // Last 12 months
          startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
          groupBy = 'month'
          break
        case 'yearly':
          // Last 5 years
          startDate = new Date(now.getFullYear() - 4, 0, 1)
          groupBy = 'year'
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
          groupBy = 'day'
      }
    }

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
          totalSales: 0,
          totalTransactions: 0,
          averageTransaction: 0,
          data: [],
        })
      }
    }

    // Build where clause
    const whereClause: {
      createdAt: { gte: Date; lte: Date }
      status: { in: TransactionStatus[] }
      details?: { some: { itemId: { in: number[] } } }
    } = {
      createdAt: {
        gte: startDate,
        lte: endDate,
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

    // Get all approved and completed transactions in the period
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        details: {
          include: {
            item: true,
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
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // For MITRA, filter out transactions with no details (after filtering)
    const filteredTransactions = token.role === 'MITRA' 
      ? transactions.filter(t => t.details.length > 0)
      : transactions

    // Group transactions by period
    const salesData: { [key: string]: { total: number; count: number } } = {}

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt)
      let key: string

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0] // YYYY-MM-DD
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
      } else {
        key = String(date.getFullYear()) // YYYY
      }

      if (!salesData[key]) {
        salesData[key] = { total: 0, count: 0 }
      }

      // For MITRA, calculate total from their items only
      const transactionTotal = transaction.details.reduce((sum, detail) => sum + detail.subtotal, 0)
      salesData[key].total += transactionTotal
      salesData[key].count += 1
    })

    // Fill in missing dates with zero values
    const result: Array<{ period: string; totalSales: number; transactionCount: number }> = []
    const current = new Date(startDate)

    while (current <= endDate) {
      let key: string

      if (groupBy === 'day') {
        key = current.toISOString().split('T')[0]
      } else if (groupBy === 'month') {
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      } else {
        key = String(current.getFullYear())
      }

      result.push({
        period: key,
        totalSales: salesData[key]?.total || 0,
        transactionCount: salesData[key]?.count || 0,
      })

      // Increment date based on groupBy
      if (groupBy === 'day') {
        current.setDate(current.getDate() + 1)
      } else if (groupBy === 'month') {
        current.setMonth(current.getMonth() + 1)
      } else {
        current.setFullYear(current.getFullYear() + 1)
      }
    }

    // Calculate summary
    const totalSales = result.reduce((sum, item) => sum + item.totalSales, 0)
    const totalTransactions = result.reduce((sum, item) => sum + item.transactionCount, 0)
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0

    return NextResponse.json({
      totalSales,
      totalTransactions,
      averageTransaction,
      data: result,
    })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
