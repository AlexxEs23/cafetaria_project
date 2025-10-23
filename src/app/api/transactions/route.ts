import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { TransactionStatus } from '@prisma/client'

// GET /api/transactions - Get all transactions (with filters)
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only PENGURUS and KASIR can view transactions
    if (token.role !== 'PENGURUS' && token.role !== 'KASIR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const statusParam = searchParams.get('status')

    const where: { 
      createdAt?: { gte?: Date; lte?: Date }
      userId?: number
      status?: TransactionStatus
    } = {}

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Filter by user
    if (userId) {
      where.userId = parseInt(userId)
    }

    // Filter by status
    if (statusParam && Object.values(TransactionStatus).includes(statusParam as TransactionStatus)) {
      where.status = statusParam as TransactionStatus
    }

    // KASIR can see:
    // 1. Their own completed transactions (userId = their id)
    // 2. All PENDING transactions (for approval)
    if (token.role === 'KASIR') {
      // If filtering by PENDING, show all pending (no userId filter)
      // Otherwise, show only their own transactions
      if (statusParam !== 'PENDING') {
        where.userId = parseInt(token.id as string)
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        details: {
          include: {
            item: {
              select: {
                id: true,
                namaBarang: true,
                hargaSatuan: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('GET /api/transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/transactions - Create new transaction (KASIR and USER)
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow both KASIR and USER to create transactions
    if (token.role !== 'KASIR' && token.role !== 'USER') {
      return NextResponse.json({ error: 'Forbidden - Only KASIR and USER can create transactions' }, { status: 403 })
    }

    const body = await request.json()
    const { items, customerName, customerLocation, notes } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 })
    }

    // For USER orders, require customer info
    if (token.role === 'USER') {
      if (!customerName || !customerLocation) {
        return NextResponse.json({ error: 'Customer name and location are required for user orders' }, { status: 400 })
      }
    }

    // Validate all items and check stock
    for (const item of items) {
      const dbItem = await prisma.item.findUnique({
        where: { id: item.itemId },
      })

      if (!dbItem) {
        return NextResponse.json({ error: `Item ${item.itemId} not found` }, { status: 404 })
      }

      if (dbItem.status !== 'TERSEDIA') {
        return NextResponse.json({ error: `Item ${dbItem.namaBarang} is not available` }, { status: 400 })
      }

      if (dbItem.jumlahStok < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${dbItem.namaBarang}. Available: ${dbItem.jumlahStok}` 
        }, { status: 400 })
      }
    }

    // Calculate total and create transaction with details
    let totalHarga = 0
    const transactionDetails: Array<{
      itemId: number
      jumlah: number
      hargaSatuan: number
      subtotal: number
    }> = []

    for (const item of items) {
      const dbItem = await prisma.item.findUnique({
        where: { id: item.itemId },
      })

      const hargaSatuan = dbItem!.hargaSatuan
      const subtotal = hargaSatuan * item.quantity
      totalHarga += subtotal

      transactionDetails.push({
        itemId: item.itemId,
        jumlah: item.quantity,
        hargaSatuan: hargaSatuan,
        subtotal,
      })
    }

    // Create transaction in a transaction (prisma transaction)
    const transaction = await prisma.$transaction(async (tx) => {
      // Determine status based on role
      const status = token.role === 'KASIR' ? 'COMPLETED' : 'PENDING'
      
      // Create transaction
      const newTransaction = await tx.transaction.create({
        data: {
          userId: parseInt(token.id as string),
          totalHarga,
          status,
          customerName: customerName || null,
          customerLocation: customerLocation || null,
          notes: notes || null,
          details: {
            create: transactionDetails,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          details: {
            include: {
              item: {
                select: {
                  id: true,
                  namaBarang: true,
                  hargaSatuan: true,
                },
              },
            },
          },
        },
      })

      // Only update stock if transaction is from KASIR (COMPLETED)
      // For USER orders (PENDING), stock will be updated when approved
      if (token.role === 'KASIR') {
        for (const item of items) {
          await tx.item.update({
            where: { id: item.itemId },
            data: {
              jumlahStok: {
                decrement: item.quantity,
              },
            },
          })

          // Update status to HABIS if stock is 0
          const updatedItem = await tx.item.findUnique({
            where: { id: item.itemId },
          })

          if (updatedItem && updatedItem.jumlahStok === 0) {
            await tx.item.update({
              where: { id: item.itemId },
              data: { status: 'HABIS' },
            })
          }
        }
      }

      return newTransaction
    })

    // Format response with proper date
    const response = {
      transaction: {
        ...transaction,
        tanggal: transaction.createdAt,
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('POST /api/transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
