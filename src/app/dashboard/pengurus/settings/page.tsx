'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const [formData, setFormData] = useState({
    kasirWhatsapp: '',
    namamPengurus: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setFormData({
        kasirWhatsapp: data.settings.kasirWhatsapp,
        namamPengurus: data.settings.namamPengurus,
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
      setMessage('Gagal mengambil data settings')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Gagal menyimpan settings')
        setMessageType('error')
      } else {
        setMessage('Settings berhasil disimpan!')
        setMessageType('success')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('Terjadi kesalahan saat menyimpan settings')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
          <p className="text-sm text-gray-600">Kelola konfigurasi global cafetaria</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              messageType === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        {/* Landing Page Settings Card */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">🎨 Pengaturan Landing Page</h2>
              <p className="text-green-100 text-sm mb-4">
                Kelola tampilan halaman utama, logo, teks hero, dan footer untuk pengunjung.
              </p>
              <button
                onClick={() => router.push('/dashboard/pengurus/settings/landing-page')}
                className="bg-white text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium"
              >
                Kelola Landing Page →
              </button>
            </div>
            <svg className="w-16 h-16 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nama Pengurus */}
            <div>
              <label htmlFor="namamPengurus" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Pengurus / Sekolah
              </label>
              <input
                type="text"
                id="namamPengurus"
                name="namamPengurus"
                value={formData.namamPengurus}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contoh: Cafetaria Sekolah ABC"
              />
              <p className="text-xs text-gray-500 mt-1">Nama yang ditampilkan di aplikasi</p>
            </div>

            {/* Nomor WhatsApp Kasir */}
            <div>
              <label htmlFor="kasirWhatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                Nomor WhatsApp Kasir
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  +62
                </span>
                <input
                  type="tel"
                  id="kasirWhatsapp"
                  name="kasirWhatsapp"
                  value={formData.kasirWhatsapp}
                  onChange={handleChange}
                  className="w-full px-4 py-2 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8XXXXXXXXX (tanpa 62)"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Format: 8XXXXXXXXX (contoh: 812345678901)
              </p>
              {formData.kasirWhatsapp && (
                <p className="text-xs text-gray-600 mt-2">
                  Link WA: https://wa.me/62{formData.kasirWhatsapp}
                </p>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Info:</strong> Nomor WhatsApp ini akan digunakan untuk redirect user saat memesan barang dari halaman menu.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
              <button
                type="button"
                onClick={() => fetchSettings()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Bantuan</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Nomor WhatsApp harus valid dan aktif untuk menerima pesan dari user</li>
            <li>• Format nomor: dimulai dari 8 (Indonesia), tidak perlu +62 atau 0</li>
            <li>• User akan diredirect ke WhatsApp dengan pesan pesanan otomatis</li>
            <li>• Pastikan WhatsApp Business atau reguler sudah setup di perangkat kasir</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
