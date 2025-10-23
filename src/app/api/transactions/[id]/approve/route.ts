import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// POST /api/transactions/[id]/approve - Approve transaction (KASIR only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (token.role !== 'KASIR') {
      return NextResponse.json({ error: 'Forbidden - Only KASIR can approve transactions' }, { status: 403 })
    }

    const { id } = await params
    const transactionId = parseInt(id)

    // Get transaction details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        details: true,
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json({ error: 'Transaction is not pending' }, { status: 400 })
    }

    // Update transaction and stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'APPROVED' },
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

      // Update stock for each item
      for (const detail of transaction.details) {
        const item = await tx.item.findUnique({
          where: { id: detail.itemId },
        })

        if (!item) {
          throw new Error(`Item ${detail.itemId} not found`)
        }

        if (item.jumlahStok < detail.jumlah) {
          throw new Error(`Insufficient stock for ${item.namaBarang}. Available: ${item.jumlahStok}`)
        }

        await tx.item.update({
          where: { id: detail.itemId },
          data: {
            jumlahStok: {
              decrement: detail.jumlah,
            },
          },
        })

        // Update status to HABIS if stock is 0
        const updatedItem = await tx.item.findUnique({
          where: { id: detail.itemId },
        })

        if (updatedItem && updatedItem.jumlahStok === 0) {
          await tx.item.update({
            where: { id: detail.itemId },
            data: { status: 'HABIS' },
          })
        }
      }

      return updatedTransaction
    })

    return NextResponse.json({ transaction: result })
  } catch (error) {
    console.error('POST /api/transactions/[id]/approve error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
