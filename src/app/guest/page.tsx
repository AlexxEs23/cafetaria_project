'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Item {
  id: number
  namaBarang: string
  fotoUrl: string
  jumlahStok: number
  hargaSatuan: number
  _count?: {
    transactionDetails: number
  }
}

interface Settings {
  cafeteriaName: string
  cafeteriaTagline: string
  heroTitle: string
  heroDescription: string
  logoUrl: string | null
  footerText: string
  contactInfo: string | null
}

export default function GuestLandingPage() {
  const [items, setItems] = useState<Item[]>([])
  const [bestSellers, setBestSellers] = useState<Item[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [showFullMenu, setShowFullMenu] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchItems(), fetchBestSellers(), fetchSettings()])
  }, [])

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items?status=TERSEDIA')
      const data = await res.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBestSellers = async () => {
    try {
      const res = await fetch('/api/items?status=TERSEDIA&bestSeller=true&limit=4')
      const data = await res.json()
      setBestSellers(data.items || [])
    } catch (error) {
      console.error('Error fetching best sellers:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setSettings(data.settings)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {settings?.logoUrl ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                  <Image
                    src={settings.logoUrl}
                    alt="Logo"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {settings?.cafeteriaName?.[0] || 'C'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {settings?.cafeteriaName || 'Cafetaria'}
                </h1>
                <p className="text-xs text-gray-500">
                  {settings?.cafeteriaTagline || 'Delicious & Fresh'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Daftar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {settings?.heroTitle || 'Selamat Datang di Cafetaria Kami'}
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {settings?.heroDescription || 'Nikmati berbagai pilihan makanan dan minuman segar dengan harga terjangkau. Pesan sekarang dan ambil di cafetaria!'}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Mulai Pesan Sekarang
            </Link>
            <a
              href="#menu"
              className="px-8 py-3 bg-white text-green-600 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl border-2 border-green-600"
            >
              Lihat Menu
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cepat & Mudah</h3>
              <p className="text-gray-600">Pesan online dan ambil di cafetaria tanpa antri panjang</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Segar & Berkualitas</h3>
              <p className="text-gray-600">Semua menu dibuat fresh setiap hari dengan bahan berkualitas</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Harga Terjangkau</h3>
              <p className="text-gray-600">Harga ramah di kantong untuk semua kalangan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Menu Hari Ini</h2>
            <p className="text-lg text-gray-600">Lihat menu yang tersedia dan stoknya</p>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-56 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Best Sellers Section */}
              {bestSellers.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="flex items-center gap-2">
                      <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <h3 className="text-3xl font-bold text-gray-900">Best Sellers</h3>
                    </div>
                    <div className="h-1 flex-1 bg-gradient-to-r from-yellow-400 to-transparent rounded"></div>
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {bestSellers.map((item, index) => (
                      <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow border-2 border-yellow-400 relative">
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          #{index + 1} Best Seller
                        </div>
                        <div className="relative h-56">
                          <Image
                            src={item.fotoUrl}
                            alt={item.namaBarang}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          />
                          {item.jumlahStok < 5 && item.jumlahStok > 0 && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                              Stok Terbatas
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{item.namaBarang}</h3>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-2xl font-bold text-green-600">
                              Rp {item.hargaSatuan.toLocaleString('id-ID')}
                            </span>
                            <span className={`text-sm px-2 py-1 rounded-full ${item.jumlahStok > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              Stok: {item.jumlahStok}
                            </span>
                          </div>
                          {item._count && item._count.transactionDetails > 0 && (
                            <p className="text-xs text-gray-500">
                              🔥 {item._count.transactionDetails} kali dipesan
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Menu Section */}
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">Full Menu</h3>
                  <button
                    onClick={() => setShowFullMenu(!showFullMenu)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                  >
                    {showFullMenu ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Sembunyikan
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Lihat Semua Menu
                      </>
                    )}
                  </button>
                </div>

                {showFullMenu && (
                  <>
                    {items.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-lg shadow-md">
                        <p className="text-gray-500 text-lg">Belum ada menu tersedia saat ini.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {items.map((item) => (
                          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
                            <div className="flex flex-col sm:flex-row">
                              {/* Image */}
                              <div className="relative w-full sm:w-48 h-48 flex-shrink-0">
                                <Image
                                  src={item.fotoUrl}
                                  alt={item.namaBarang}
                                  fill
                                  className="object-cover"
                                  sizes="192px"
                                />
                                {item.jumlahStok < 5 && item.jumlahStok > 0 && (
                                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                                    Stok terbatas
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 p-4 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.namaBarang}</h3>
                                  <div className="flex flex-wrap items-center gap-4">
                                    <span className="text-2xl font-bold text-green-600">
                                      Rp {item.hargaSatuan.toLocaleString('id-ID')}
                                    </span>
                                    <span className={`text-sm px-3 py-1 rounded-full ${item.jumlahStok > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      Stok: {item.jumlahStok}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Siap Untuk Memesan?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Daftar sekarang dan nikmati kemudahan pesan menu favorit Anda
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-green-600 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
          >
            Daftar Sekarang - Gratis!
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                {settings?.logoUrl ? (
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                    <Image
                      src={settings.logoUrl}
                      alt="Logo"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">
                      {settings?.cafeteriaName?.[0] || 'C'}
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-bold">
                  {settings?.cafeteriaName || 'Cafetaria'}
                </h3>
              </div>
              <p className="text-gray-400 text-sm">
                {settings?.footerText || 'Menyediakan makanan dan minuman segar berkualitas dengan harga terjangkau.'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#menu" className="hover:text-white transition-colors">Menu</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Daftar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <p className="text-sm text-gray-400">
                {settings?.contactInfo || 'Untuk informasi lebih lanjut, silakan hubungi admin cafetaria.'}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 {settings?.cafeteriaName || 'Cafetaria'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
