'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ReportData {
  period: string
  totalSales: number
  transactionCount: number
}

interface ReportSummary {
  totalSales: number
  totalTransactions: number
  averageTransaction: number
  data: ReportData[]
}

type Period = 'daily' | 'monthly' | 'yearly'

export default function PengurusLaporan() {
  const { status } = useSession()
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('daily')
  const [reportData, setReportData] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch report')
      const data = await res.json()
      setReportData(data)
    } catch (error) {
      console.error('Error fetching report:', error)
      alert('Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const formatPeriodLabel = (dateStr: string): string => {
    if (period === 'daily') {
      const date = new Date(dateStr)
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    } else if (period === 'monthly') {
      const [year, month] = dateStr.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    } else {
      return dateStr
    }
  }

  const chartData = reportData?.data.map(item => ({
    periode: formatPeriodLabel(item.period),
    'Total Penjualan': item.totalSales,
    'Jumlah Transaksi': item.transactionCount
  })) || []

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat laporan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Laporan Penjualan</h1>
            <p className="text-sm text-green-100">Dashboard Pengurus</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => router.push('/dashboard/pengurus')}
              className="px-4 py-2 text-sm bg-white text-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors"
            >
              ← Kembali
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 text-sm bg-white text-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pilih Periode</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                period === 'daily'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Harian (7 Hari)
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                period === 'monthly'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Bulanan (12 Bulan)
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                period === 'yearly'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tahunan (5 Tahun)
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Penjualan</h3>
            <p className="text-3xl font-bold text-green-600">
              Rp {reportData?.totalSales.toLocaleString('id-ID') || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Transaksi</h3>
            <p className="text-3xl font-bold text-blue-600">
              {reportData?.totalTransactions || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Rata-rata Transaksi</h3>
            <p className="text-3xl font-bold text-purple-600">
              Rp {Math.round(reportData?.averageTransaction || 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Trend */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tren Penjualan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="periode" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Total Penjualan" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Transaction Count */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Jumlah Transaksi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="periode" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="Jumlah Transaksi" 
                  fill="#2563eb" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Detail Data</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Penjualan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Transaksi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rata-rata
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPeriodLabel(item.period)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      Rp {item.totalSales.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.transactionCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      Rp {item.transactionCount > 0 
                        ? Math.round(item.totalSales / item.transactionCount).toLocaleString('id-ID')
                        : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
