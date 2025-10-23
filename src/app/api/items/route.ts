import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { ItemStatus, Prisma } from '@prisma/client'

// GET /api/items - Get all items (with filters)
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ItemStatus | null
    const mitraId = searchParams.get('mitraId')
    const bestSeller = searchParams.get('bestSeller') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const where: Prisma.ItemWhereInput = {}
    
    // Allow public access only for TERSEDIA items (landing page)
    if (!token) {
      // Unauthenticated users can only see TERSEDIA items
      where.status = 'TERSEDIA'
    } else {
      // Authenticated users - apply role-based filters
      if (status) {
        where.status = status
      }

      if (mitraId) {
        where.mitraId = parseInt(mitraId)
      }

      // Jika role MITRA, hanya tampilkan barang miliknya
      if (token.role === 'MITRA') {
        where.mitraId = parseInt(token.id as string)
      }

      // Jika role USER atau KASIR, hanya tampilkan barang TERSEDIA
      if (token.role === 'USER' || token.role === 'KASIR') {
        where.status = 'TERSEDIA'
      }
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        mitra: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ...(bestSeller && {
          _count: {
            select: {
              transactionDetails: true,
            },
          },
        }),
      },
      orderBy: bestSeller
        ? {
            transactionDetails: {
              _count: 'desc',
            },
          }
        : {
            createdAt: 'desc',
          },
      ...(limit && { take: limit }),
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('GET /api/items error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/items - Create new item (MITRA only)
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (token.role !== 'MITRA' && token.role !== 'PENGURUS') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { namaBarang, fotoUrl, jumlahStok, hargaSatuan } = body

    if (!namaBarang || !fotoUrl || jumlahStok === undefined || hargaSatuan === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const item = await prisma.item.create({
      data: {
        namaBarang,
        fotoUrl,
        jumlahStok: parseInt(jumlahStok),
        hargaSatuan: parseFloat(hargaSatuan),
        status: token.role === 'MITRA' ? 'PENDING' : 'TERSEDIA',
        mitraId: token.role === 'MITRA' ? parseInt(token.id as string) : null,
      },
      include: {
        mitra: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('POST /api/items error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
