'use client'

import { signIn, useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { getRoleBasedRedirect } from '@/lib/role'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const callbackUrl = searchParams.get('callbackUrl')
  const hasRedirected = useRef(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !hasRedirected.current) {
      hasRedirected.current = true
      const role = (session.user as { role: string }).role
      const redirectUrl = callbackUrl || getRoleBasedRedirect(role)
      window.location.href = redirectUrl
    }
  }, [status, session, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email atau password salah')
        setLoading(false)
      } else if (result?.ok && !hasRedirected.current) {
        hasRedirected.current = true
        
        // Wait a bit for session to be established
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Get session to determine role
        const response = await fetch('/api/auth/session')
        const sessionData = await response.json()
        
        if (sessionData?.user?.role) {
          const role = sessionData.user.role
          const redirectUrl = callbackUrl || getRoleBasedRedirect(role)
          
          // Use window.location for reliable redirect
          window.location.href = redirectUrl
        } else {
          // Fallback if role not found
          window.location.href = callbackUrl || '/menu'
        }
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Cafetaria
          </h1>
          <p className="text-xl font-semibold text-gray-800 mb-1">
            Selamat datang di Cafetaria
          </p>
          <p className="text-sm text-gray-500">
            Tempat di mana rasa menjadi kisah karya seni.perpaduan
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-black">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-sm"
              placeholder="kasir@gmail.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-700 text-white py-3 px-4 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Memproses...' : 'Submit'}
          </button>
        </form>

        {/* Link to Register */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <a href="/register" className="text-teal-700 font-medium hover:text-teal-800">
              Daftar di sini
            </a>
          </p>
        </div>

        {/* Demo accounts info - hidden by default */}
        <details className="mt-4">
          <summary className="text-center text-sm text-gray-500 cursor-pointer hover:text-gray-700">
            Demo Accounts
          </summary>
          <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold mb-2">Test Credentials:</p>
            <div className="space-y-1">
              <p>• Pengurus: pengurus@test.com</p>
              <p>• Kasir: kasir@test.com</p>
              <p>• Mitra: mitra@test.com</p>
              <p>• User: user@test.com</p>
              <p className="mt-2">Password: password123</p>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
