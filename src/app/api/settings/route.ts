import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// GET /api/settings - Get settings (public)
export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 1 },
    })

    // Create default settings if not exist
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 1,
          kasirWhatsapp: '',
          namamPengurus: 'Cafetaria',
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/settings - Update settings (KASIR only)
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (token.role !== 'KASIR') {
      return NextResponse.json({ error: 'Forbidden - Only KASIR can update settings' }, { status: 403 })
    }

    const body = await request.json()
    const { kasirWhatsapp, namamPengurus } = body

    // Validate WhatsApp number format
    if (kasirWhatsapp && !/^\d{10,15}$/.test(kasirWhatsapp.replace(/\D/g, ''))) {
      return NextResponse.json({ 
        error: 'Invalid WhatsApp number format. Use format: 628XXXXXXXXX' 
      }, { status: 400 })
    }

    const settings = await prisma.settings.update({
      where: { id: 1 },
      data: {
        ...(kasirWhatsapp !== undefined && { kasirWhatsapp }),
        ...(namamPengurus !== undefined && { namamPengurus }),
      },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
