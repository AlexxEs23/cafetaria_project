import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// POST /api/transactions/[id]/reject - Reject transaction (KASIR only)
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
      return NextResponse.json({ error: 'Forbidden - Only KASIR can reject transactions' }, { status: 403 })
    }

    const { id } = await params
    const transactionId = parseInt(id)

    // Get transaction details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json({ error: 'Transaction is not pending' }, { status: 400 })
    }

    // Update transaction status to REJECTED
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'REJECTED' },
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

    return NextResponse.json({ transaction: updatedTransaction })
  } catch (error) {
    console.error('POST /api/transactions/[id]/reject error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
