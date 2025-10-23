'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TransactionDetail {
  id: number
  itemId: number
  jumlah: number
  hargaSatuan: number
  subtotal: number
  item: {
    namaBarang: string
  }
}

interface Transaction {
  id: number
  totalHarga: number
  status: string
  createdAt: string
  customerName: string | null
  customerLocation: string | null
  details: TransactionDetail[]
}

interface DailyReport {
  date: string
  dayName: string
  totalSales: number
  transactionCount: number
  averageTransaction: number
  transactions: Transaction[]
  topItems: Array<{
    itemName: string
    quantity: number
    revenue: number
  }>
  hourlyDistribution: Array<{
    hour: string
    count: number
    sales: number
  }>
}

interface RangeReport {
  totalSales: number
  totalTransactions: number
  averageTransaction: number
  data: Array<{
    period: string
    totalSales: number
    transactionCount: number
  }>
}

type FilterMode = 'single' | 'range'

export default function KasirLaporan() {
  const { status } = useSession()
  const router = useRouter()
  const [filterMode, setFilterMode] = useState<FilterMode>('single')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [startDate, setStartDate] = useState(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null)
  const [rangeReport, setRangeReport] = useState<RangeReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode, selectedDate, startDate, endDate])

  const fetchReport = async () => {
    setLoading(true)
    try {
      if (filterMode === 'single') {
        const res = await fetch(`/api/reports/daily?date=${selectedDate}`)
        if (!res.ok) throw new Error('Failed to fetch report')
        const data = await res.json()
        setDailyReport(data)
      } else {
        const res = await fetch(`/api/reports?period=daily&startDate=${startDate}&endDate=${endDate}`)
        if (!res.ok) throw new Error('Failed to fetch report')
        const data = await res.json()
        setRangeReport(data)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      alert('Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
  }

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat laporan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-teal-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Laporan Penjualan</h1>
            <p className="text-sm text-teal-100">Dashboard Kasir</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => router.push('/dashboard/kasir')}
              className="px-4 py-2 text-sm bg-white text-teal-700 rounded-lg hover:bg-teal-50 font-medium transition-colors"
            >
              ← Kembali
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 text-sm bg-white text-teal-700 rounded-lg hover:bg-teal-50 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Filter Laporan</h2>
          
          {/* Filter Mode Toggle */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setFilterMode('single')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                filterMode === 'single'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📅 Satu Hari
            </button>
            <button
              onClick={() => setFilterMode('range')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                filterMode === 'range'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 Rentang Tanggal
            </button>
          </div>

          {/* Date Inputs */}
          {filterMode === 'single' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Tanggal
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content based on filter mode */}
        {filterMode === 'single' && dailyReport ? (
          <>
            {/* Day Info */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm mb-1">Laporan Tanggal</p>
                  <h2 className="text-3xl font-bold">{dailyReport.dayName}</h2>
                  <p className="text-teal-100 mt-1">
                    {new Date(dailyReport.date).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-teal-100 text-sm mb-1">Total Penjualan</p>
                  <p className="text-4xl font-bold">{formatCurrency(dailyReport.totalSales)}</p>
                  <p className="text-teal-100 mt-1">{dailyReport.transactionCount} Transaksi</p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Penjualan</p>
                    <p className="text-2xl font-bold text-teal-600">
                      {formatCurrency(dailyReport.totalSales)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Jumlah Transaksi</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {dailyReport.transactionCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Rata-rata</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(Math.round(dailyReport.averageTransaction))}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Hourly Sales Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Penjualan Per Jam</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyReport.hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="sales" name="Penjualan" fill="#0f766e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Hourly Transaction Count */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Transaksi Per Jam</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyReport.hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Jumlah Transaksi"
                      stroke="#2563eb" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Items */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">🏆 Top 10 Menu Terlaris</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Menu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Terjual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Pendapatan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dailyReport.topItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.itemName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.quantity} item
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-teal-600">
                          {formatCurrency(item.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">📋 Daftar Transaksi Detail</h3>
                <span className="text-sm text-gray-600">{dailyReport.transactions.length} transaksi</span>
              </div>
              <div className="divide-y divide-gray-200">
                {dailyReport.transactions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Tidak ada transaksi pada tanggal ini
                  </div>
                ) : (
                  dailyReport.transactions.map((transaction) => (
                    <div key={transaction.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">#{transaction.id}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              transaction.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Waktu:</span> {formatTime(transaction.createdAt)}
                          </p>
                          {transaction.customerName && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Pembeli:</span> {transaction.customerName}
                              {transaction.customerLocation && ` - ${transaction.customerLocation}`}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-teal-600">
                            {formatCurrency(transaction.totalHarga)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Transaction Items */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Item</p>
                        <div className="space-y-2">
                          {transaction.details.map((detail) => (
                            <div key={detail.id} className="flex justify-between items-center">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{detail.item.namaBarang}</p>
                                <p className="text-xs text-gray-500">
                                  {detail.jumlah} x {formatCurrency(detail.hargaSatuan)}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(detail.subtotal)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : filterMode === 'range' && rangeReport ? (
          <>
            {/* Range Report Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Penjualan</h3>
                <p className="text-3xl font-bold text-teal-600">
                  {formatCurrency(rangeReport.totalSales)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Transaksi</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {rangeReport.totalTransactions}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Rata-rata Transaksi</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(Math.round(rangeReport.averageTransaction))}
                </p>
              </div>
            </div>

            {/* Range Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tren Penjualan</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={rangeReport.data.map((item) => ({
                    tanggal: formatDate(item.period),
                    'Total Penjualan': item.totalSales
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="tanggal" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Total Penjualan" 
                      stroke="#0f766e" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Jumlah Transaksi</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rangeReport.data.map((item) => ({
                    tanggal: formatDate(item.period),
                    'Jumlah Transaksi': item.transactionCount
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="tanggal" 
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

            {/* Range Data Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Detail Data</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
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
                    {rangeReport.data.map((item, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(item.period)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-teal-600">
                          {formatCurrency(item.totalSales)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.transactionCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(item.transactionCount > 0 
                            ? Math.round(item.totalSales / item.transactionCount)
                            : 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
