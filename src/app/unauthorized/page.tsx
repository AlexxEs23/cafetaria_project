'use client'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <span className="text-6xl">🚫</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Akses Ditolak
        </h1>
        <p className="text-gray-600 mb-6">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <a
          href="/login"
          className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Kembali ke Login
        </a>
      </div>
    </div>
  )
}
