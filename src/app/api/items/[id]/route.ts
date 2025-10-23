import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { ItemStatus } from '@prisma/client'

// GET /api/items/[id] - Get single item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const item = await prisma.item.findUnique({
      where: { id: parseInt(id) },
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

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('GET /api/items/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/items/[id] - Update item (PENGURUS or MITRA owner)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = await params
    const itemId = parseInt(id)

    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Check permission
    if (token.role === 'MITRA' && existingItem.mitraId !== parseInt(token.id as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (token.role !== 'PENGURUS' && token.role !== 'MITRA') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: {
      namaBarang?: string
      fotoUrl?: string
      jumlahStok?: number
      hargaSatuan?: number
      status?: ItemStatus
    } = {}

    if (body.namaBarang !== undefined) updateData.namaBarang = body.namaBarang
    if (body.fotoUrl !== undefined) updateData.fotoUrl = body.fotoUrl
    if (body.jumlahStok !== undefined) updateData.jumlahStok = parseInt(body.jumlahStok)
    if (body.hargaSatuan !== undefined) updateData.hargaSatuan = parseFloat(body.hargaSatuan)
    
    // Only PENGURUS can change status
    if (body.status !== undefined && token.role === 'PENGURUS') {
      updateData.status = body.status as ItemStatus
    }

    const item = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
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

    return NextResponse.json({ item })
  } catch (error) {
    console.error('PATCH /api/items/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/items/[id] - Delete item (PENGURUS or MITRA owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const itemId = parseInt(id)

    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Check permission - PENGURUS can delete any item, MITRA can only delete their own
    if (token.role === 'MITRA' && existingItem.mitraId !== parseInt(token.id as string)) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own items' }, { status: 403 })
    }

    if (token.role !== 'PENGURUS' && token.role !== 'MITRA') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.item.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/items/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
