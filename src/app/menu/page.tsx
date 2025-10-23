'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Modal from '@/components/Modal'

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
  kasirWhatsapp: string
  namamPengurus: string
}

interface CartItem {
  item: Item
  quantity: number
}

export default function MenuPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [bestSellers, setBestSellers] = useState<Item[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [showFullMenu, setShowFullMenu] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Form data
  const [customerName, setCustomerName] = useState('')
  const [customerLocation, setCustomerLocation] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

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

  const addToCart = (item: Item) => {
    const existingItem = cart.find(c => c.item.id === item.id)
    
    if (existingItem) {
      if (existingItem.quantity >= item.jumlahStok) {
        alert('Stok tidak cukup!')
        return
      }
      setCart(cart.map(c => 
        c.item.id === item.id 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ))
    } else {
      setCart([...cart, { item, quantity: 1 }])
    }
  }

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(c => c.item.id !== itemId))
  }

  const updateQuantity = (itemId: number, quantity: number) => {
    const item = items.find(i => i.id === itemId)
    
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    
    if (item && quantity > item.jumlahStok) {
      alert('Stok tidak cukup!')
      return
    }
    
    setCart(cart.map(c => 
      c.item.id === itemId 
        ? { ...c, quantity }
        : c
    ))
  }

  const calculateTotal = () => {
    return cart.reduce((total, c) => total + (c.item.hargaSatuan * c.quantity), 0)
  }

  const handleOrderViaWhatsApp = async () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong!')
      return
    }

    if (!customerName || !customerLocation) {
      alert('Mohon isi nama dan lokasi Anda')
      return
    }

    if (!settings?.kasirWhatsapp) {
      alert('Nomor WhatsApp kasir belum diatur')
      return
    }

    setProcessing(true)

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map(c => ({
            itemId: c.item.id,
            quantity: c.quantity,
          })),
          customerName,
          customerLocation,
          notes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat pesanan')
      }

      const itemsList = cart.map(c => 
        `${c.quantity}x ${c.item.namaBarang} - Rp ${(c.item.hargaSatuan * c.quantity).toLocaleString('id-ID')}`
      ).join('\n')

      const message = `🛒 *Pesanan Baru* (ID: #${data.transaction.id})

*Dari:* ${customerName}
*Lokasi:* ${customerLocation}

*Pesanan:*
${itemsList}

*Total:* Rp ${calculateTotal().toLocaleString('id-ID')}

${notes ? `*Catatan:* ${notes}\n` : ''}_Pesanan akan diproses setelah dikonfirmasi._`

      const waLink = `https://wa.me/62${settings.kasirWhatsapp}?text=${encodeURIComponent(message)}`
      
      window.open(waLink, '_blank')
      
      setOrderSuccess(true)
      setShowCheckoutModal(false)
      
      setCart([])
      setCustomerName('')
      setCustomerLocation('')
      setNotes('')
    } catch (error) {
      console.error('Error creating order:', error)
      alert(error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setProcessing(false)
    }
  }

  const handleShowDetail = (item: Item) => {
    setSelectedItem(item)
    setShowDetailModal(true)
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Cafetaria</h1>
            <p className="text-sm text-gray-600">Selamat datang, {session?.user?.name}</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setShowCheckoutModal(true)}
              className="relative px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              🛒 Keranjang ({cart.length})
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Menu Hari Ini</h2>
          <p className="text-xl">Nikmati berbagai pilihan makanan dan minuman segar</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Best Sellers Section */}
        {bestSellers.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h2 className="text-3xl font-bold text-gray-900">Best Sellers</h2>
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
                    />
                    {item.jumlahStok < 5 && item.jumlahStok > 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Stok terbatas
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.namaBarang}</h3>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-green-600">
                        Rp {item.hargaSatuan.toLocaleString('id-ID')}
                      </span>
                      <span className="text-sm text-gray-600">
                        Stok: {item.jumlahStok}
                      </span>
                    </div>
                    {item._count && item._count.transactionDetails > 0 && (
                      <p className="text-xs text-gray-500 mb-3">
                        🔥 {item._count.transactionDetails} kali dipesan
                      </p>
                    )}
                    <button
                      onClick={() => addToCart(item)}
                      disabled={item.jumlahStok === 0}
                      className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      + Keranjang
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Items Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Full Menu</h2>
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
                <div className="text-center py-12">
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
                            <div className="flex flex-wrap items-center gap-4 mb-3">
                              <span className="text-2xl font-bold text-green-600">
                                Rp {item.hargaSatuan.toLocaleString('id-ID')}
                              </span>
                              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                Stok: {item.jumlahStok}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={() => handleShowDetail(item)}
                              className="flex-1 sm:flex-none bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Detail
                            </button>
                            <button
                              onClick={() => addToCart(item)}
                              disabled={item.jumlahStok === 0}
                              className="flex-1 bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              + Keranjang
                            </button>
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
      </main>

      <Modal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} title="Keranjang Belanja" maxWidth="lg">
        <div className="space-y-6">
          {cart.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Keranjang masih kosong</p>
          ) : (
            <>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {cart.map((cartItem) => (
                  <div key={cartItem.item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image src={cartItem.item.fotoUrl} alt={cartItem.item.namaBarang} fill className="object-cover rounded" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{cartItem.item.namaBarang}</h4>
                      <p className="text-sm text-gray-600">Rp {cartItem.item.hargaSatuan.toLocaleString('id-ID')}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)} className="bg-gray-200 px-2 py-1 rounded text-sm hover:bg-gray-300">-</button>
                        <span className="text-sm font-medium">{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)} className="bg-gray-200 px-2 py-1 rounded text-sm hover:bg-gray-300">+</button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">Rp {(cartItem.item.hargaSatuan * cartItem.quantity).toLocaleString('id-ID')}</p>
                      <button onClick={() => removeFromCart(cartItem.item.id)} className="text-red-600 hover:text-red-800 text-sm mt-2">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Info Pembeli</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Nama Anda" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi/Kelas <span className="text-red-500">*</span></label>
                  <input type="text" value={customerLocation} onChange={(e) => setCustomerLocation(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Contoh: Kelas 12 A, Kantin, dll" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Catatan tambahan..." rows={3} />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-900">Total Pembayaran:</span>
                  <span className="text-2xl font-bold text-green-600">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                </div>
                <button onClick={handleOrderViaWhatsApp} disabled={processing || !customerName || !customerLocation} className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.281-4.949 5.514-4.949 8.882 0 3.12.563 6.166 1.68 9.055l-1.494 5.45a.426.426 0 00.537.537l5.45-1.494c2.89 1.117 5.935 1.68 9.056 1.68 3.368 0 6.601-1.894 8.882-4.948 2.28-3.055 3.378-6.288 3.378-9.886 0-3.368-1.894-6.601-4.949-8.882-3.054-2.28-6.287-3.378-9.886-3.378z" />
                  </svg>
                  {processing ? 'Memproses...' : 'Pesan via WhatsApp'}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">Pesanan akan disimpan dan menunggu konfirmasi dari kasir</p>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal isOpen={orderSuccess} onClose={() => setOrderSuccess(false)} title="Pesanan Berhasil!" maxWidth="md">
        <div className="text-center py-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Pesanan Berhasil Dibuat!</h3>
          <p className="text-gray-600 mb-6">Pesanan Anda telah disimpan dan dikirim ke kasir via WhatsApp. Silakan tunggu konfirmasi dari kasir.</p>
          <button onClick={() => setOrderSuccess(false)} className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700">Tutup</button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Detail Menu" maxWidth="xl">
        {selectedItem && (
          <div className="space-y-6">
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              <Image
                src={selectedItem.fotoUrl}
                alt={selectedItem.namaBarang}
                fill
                className="object-cover"
              />
              {selectedItem.jumlahStok < 5 && selectedItem.jumlahStok > 0 && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-white text-sm px-4 py-2 rounded-full font-medium">
                  ⚠️ Stok terbatas
                </div>
              )}
              {selectedItem.jumlahStok === 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-sm px-4 py-2 rounded-full font-medium">
                  ❌ Stok habis
                </div>
              )}
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedItem.namaBarang}</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Harga</p>
                  <p className="text-3xl font-bold text-green-600">
                    Rp {selectedItem.hargaSatuan.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Stok Tersedia</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {selectedItem.jumlahStok}
                  </p>
                </div>
              </div>

              {selectedItem._count && selectedItem._count.transactionDetails > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-yellow-900">Menu Populer!</p>
                      <p className="text-sm text-yellow-700">Sudah dipesan {selectedItem._count.transactionDetails} kali</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    addToCart(selectedItem)
                    setShowDetailModal(false)
                  }}
                  disabled={selectedItem.jumlahStok === 0}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Tambah ke Keranjang
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 text-center text-gray-600 text-sm">
          <p>&copy; 2025 Cafetaria Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
