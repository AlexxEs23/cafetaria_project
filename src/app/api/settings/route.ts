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
          cafeteriaName: 'Cafetaria',
          cafeteriaTagline: 'Delicious & Fresh',
          heroTitle: 'Selamat Datang di Cafetaria Kami',
          heroDescription: 'Nikmati berbagai pilihan makanan dan minuman segar dengan harga terjangkau. Pesan sekarang dan ambil di cafetaria!',
          footerText: 'Menyediakan makanan dan minuman segar berkualitas dengan harga terjangkau.',
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

    // Only KASIR and PENGURUS can update settings
    if (token.role !== 'KASIR' && token.role !== 'PENGURUS') {
      return NextResponse.json({ error: 'Forbidden - Only KASIR or PENGURUS can update settings' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      kasirWhatsapp, 
      namamPengurus,
      cafeteriaName,
      cafeteriaTagline,
      heroTitle,
      heroDescription,
      logoUrl,
      footerText,
      contactInfo
    } = body

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
        ...(cafeteriaName !== undefined && { cafeteriaName }),
        ...(cafeteriaTagline !== undefined && { cafeteriaTagline }),
        ...(heroTitle !== undefined && { heroTitle }),
        ...(heroDescription !== undefined && { heroDescription }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(footerText !== undefined && { footerText }),
        ...(contactInfo !== undefined && { contactInfo }),
      },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
