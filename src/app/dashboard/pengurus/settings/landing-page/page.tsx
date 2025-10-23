'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Settings {
  cafeteriaName: string
  cafeteriaTagline: string
  heroTitle: string
  heroDescription: string
  logoUrl: string | null
  footerText: string
  contactInfo: string | null
}

export default function LandingPageSettings() {
  const { status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Form states
  const [cafeteriaName, setCafeteriaName] = useState('')
  const [cafeteriaTagline, setCafeteriaTagline] = useState('')
  const [heroTitle, setHeroTitle] = useState('')
  const [heroDescription, setHeroDescription] = useState('')
  const [footerText, setFooterText] = useState('')
  const [contactInfo, setContactInfo] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data.settings) {
        setSettings(data.settings)
        setCafeteriaName(data.settings.cafeteriaName || '')
        setCafeteriaTagline(data.settings.cafeteriaTagline || '')
        setHeroTitle(data.settings.heroTitle || '')
        setHeroDescription(data.settings.heroDescription || '')
        setFooterText(data.settings.footerText || '')
        setContactInfo(data.settings.contactInfo || '')
        setLogoPreview(data.settings.logoUrl)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let logoUrl = settings?.logoUrl || null

      // Upload logo jika ada file baru
      if (logoFile) {
        const formData = new FormData()
        formData.append('file', logoFile)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const uploadData = await uploadRes.json()

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Gagal upload logo')
        }

        logoUrl = uploadData.url
      } else if (logoPreview === null && settings?.logoUrl) {
        // Logo dihapus
        logoUrl = null
      }

      // Update settings
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cafeteriaName,
          cafeteriaTagline,
          heroTitle,
          heroDescription,
          logoUrl,
          footerText,
          contactInfo: contactInfo || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan pengaturan')
      }

      alert('Pengaturan landing page berhasil disimpan!')
      fetchSettings()
      setLogoFile(null)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat pengaturan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">⚙️ Pengaturan Landing Page</h1>
            <p className="text-sm text-green-100">Kelola tampilan halaman utama</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => router.push('/dashboard/pengurus/settings')}
              className="px-4 py-2 text-sm bg-white text-green-700 rounded-lg hover:bg-green-50 font-medium transition-colors"
            >
              ← Kembali
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 text-sm bg-white text-green-700 rounded-lg hover:bg-green-50 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo Cafetaria (Opsional)
              </label>
              <div className="flex items-start gap-4">
                {logoPreview && (
                  <div className="relative w-24 h-24 rounded-lg border-2 border-gray-300 overflow-hidden">
                    <Image
                      src={logoPreview}
                      alt="Logo Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    onChange={handleLogoChange}
                    accept="image/*"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: JPG, PNG, WebP (Max: 5MB). Logo akan ditampilkan di header dan footer.
                  </p>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Hapus Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cafeteria Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Cafetaria <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cafeteriaName}
                onChange={(e) => setCafeteriaName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Cafetaria Sekolah"
              />
            </div>

            {/* Cafeteria Tagline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tagline <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cafeteriaTagline}
                onChange={(e) => setCafeteriaTagline(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Delicious & Fresh"
              />
            </div>

            {/* Hero Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Judul Hero <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                required
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Selamat Datang di Cafetaria Kami"
              />
            </div>

            {/* Hero Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Hero <span className="text-red-500">*</span>
              </label>
              <textarea
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Deskripsi singkat yang menarik untuk halaman utama"
              />
            </div>

            {/* Footer Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teks Footer <span className="text-red-500">*</span>
              </label>
              <textarea
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Deskripsi singkat untuk footer"
              />
            </div>

            {/* Contact Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Informasi Kontak (Opsional)
              </label>
              <textarea
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Email: cafetaria@sekolah.com, Telp: (021) 12345678"
              />
            </div>

            {/* Preview Link */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                💡 <strong>Tips:</strong> Setelah menyimpan, Anda bisa melihat hasilnya di halaman landing page.
              </p>
              <a
                href="/guest"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                🔗 Lihat Landing Page
              </a>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {saving ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/pengurus/settings')}
                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
