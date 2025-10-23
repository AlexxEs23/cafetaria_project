import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seeding...')

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create users
  const pengurus = await prisma.user.upsert({
    where: { email: 'pengurus@test.com' },
    update: {},
    create: {
      email: 'pengurus@test.com',
      name: 'Admin Pengurus',
      password: hashedPassword,
      role: 'PENGURUS',
    },
  })

  const kasir = await prisma.user.upsert({
    where: { email: 'kasir@test.com' },
    update: {},
    create: {
      email: 'kasir@test.com',
      name: 'Kasir 1',
      password: hashedPassword,
      role: 'KASIR',
    },
  })

  const mitra = await prisma.user.upsert({
    where: { email: 'mitra@test.com' },
    update: {},
    create: {
      email: 'mitra@test.com',
      name: 'Mitra Supplier',
      password: hashedPassword,
      role: 'MITRA',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      name: 'User Biasa',
      password: hashedPassword,
      role: 'USER',
    },
  })

  console.log('✅ Users created:', { pengurus, kasir, mitra, user })

  // Create sample items
  const items = await Promise.all([
    prisma.item.create({
      data: {
        namaBarang: 'Nasi Goreng',
        fotoUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
        jumlahStok: 20,
        hargaSatuan: 15000,
        status: 'TERSEDIA',
        mitraId: mitra.id,
      },
    }),
    prisma.item.create({
      data: {
        namaBarang: 'Mie Ayam',
        fotoUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop',
        jumlahStok: 15,
        hargaSatuan: 12000,
        status: 'TERSEDIA',
        mitraId: mitra.id,
      },
    }),
    prisma.item.create({
      data: {
        namaBarang: 'Es Teh Manis',
        fotoUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
        jumlahStok: 30,
        hargaSatuan: 5000,
        status: 'TERSEDIA',
        mitraId: mitra.id,
      },
    }),
    prisma.item.create({
      data: {
        namaBarang: 'Ayam Geprek',
        fotoUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop',
        jumlahStok: 10,
        hargaSatuan: 18000,
        status: 'PENDING',
        mitraId: mitra.id,
      },
    }),
  ])

  console.log('✅ Items created:', items.length)

  // Create default settings
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      kasirWhatsapp: '81234567890',
      namamPengurus: 'Cafetaria Sekolah',
      cafeteriaName: 'Cafetaria',
      cafeteriaTagline: 'Delicious & Fresh',
      heroTitle: 'Selamat Datang di Cafetaria Kami',
      heroDescription: 'Nikmati berbagai pilihan makanan dan minuman segar dengan harga terjangkau. Pesan sekarang dan ambil di cafetaria!',
      logoUrl: null,
      footerText: 'Menyediakan makanan dan minuman segar berkualitas dengan harga terjangkau.',
      contactInfo: null,
    },
  })

  console.log('✅ Settings created:', settings)

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
