import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { formatRupiahCompact } from '../utils/helpers'
import { transactionService } from '../services/transactionService'
import { wishlistService } from '../services/wishlistService'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorDisplay from '../components/ui/ErrorDisplay'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState({
    pemasukan: 0,
    pengeluaran: 0,
    saldo: 0
  })
  const [chartData, setChartData] = useState({
    pemasukan: [],
    pengeluaran: []
  })
  const [wishlists, setWishlists] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchDashboardData()
  }, [selectedYear])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [selectedYear])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [summaryRes, chartRes, wishlistRes] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getChartData(selectedYear),
        wishlistService.getWishlists()
      ])

      setSummary(summaryRes.data)
      setChartData(chartRes.data)
      setWishlists(wishlistRes.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data dashboard')
      console.error('Error fetching dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#2A2A2A] py-2 px-[14px] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.5)] text-[12px] font-semibold text-white border border-white/10">
          {formatRupiahCompact(payload[0].value)}
        </div>
      )
    }
    return null
  }

  const calculateProgress = (saved, target) => {
    if (!target) return 0
    return Math.min(100, Math.round((saved / target) * 100))
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorDisplay message={error} onRetry={fetchDashboardData} />
      </div>
    )
  }

  return (
    <div className="text-white pb-10 animate-fade-in">
      <h3 className="text-[28px] md:text-[32px] font-normal text-white m-0 mb-1">
        Hi, {user?.name || 'user'}
      </h3>
      <p className="font-['Inter',_sans-serif] text-[14px] text-white/80 mb-[30px] -mt-[15px]">
        Welcome back to Dashboard!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="relative h-[130px] rounded-2xl p-6 flex flex-col justify-center overflow-hidden shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-700">
          <div className="relative z-[2] flex justify-between items-start mb-2">
            <span className="text-emerald-50 text-[15px] font-medium opacity-90">Total Saldo</span>
            <span className="text-emerald-200/50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={2}></rect>
                <circle cx="12" cy="12" r="2" strokeWidth={2}></circle>
                <path d="M6 12h.01M18 12h.01" strokeWidth={2}></path>
              </svg>
            </span>
          </div>
          <div className="relative z-[2] text-white text-[28px] md:text-[32px] font-bold">
            {formatRupiahCompact(summary.saldo)}
          </div>
        </div>

        <div className="relative h-[130px] rounded-2xl p-6 flex flex-col justify-center overflow-hidden shadow-lg bg-gradient-to-br from-blue-600 to-blue-700">
          <div className="relative z-[2] flex justify-between items-start mb-2">
            <span className="text-blue-50 text-[15px] font-medium opacity-90">Total Pemasukan</span>
            <span className="text-blue-200/50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeWidth={2}></polyline>
                <polyline points="17 6 23 6 23 12" strokeWidth={2}></polyline>
              </svg>
            </span>
          </div>
          <div className="relative z-[2] text-white text-[28px] md:text-[32px] font-bold">
            {formatRupiahCompact(summary.pemasukan)}
          </div>
        </div>
        
        <div className="relative h-[130px] rounded-2xl p-6 flex flex-col justify-center overflow-hidden shadow-lg bg-gradient-to-br from-red-600 to-red-700">
          <div className="relative z-[2] flex justify-between items-start mb-2">
            <span className="text-red-50 text-[15px] font-medium opacity-90">Total Pengeluaran</span>
            <span className="text-red-200/50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" strokeWidth={2}></polyline>
                <polyline points="17 18 23 18 23 12" strokeWidth={2}></polyline>
              </svg>
            </span>
          </div>
          <div className="relative z-[2] text-white text-[28px] md:text-[32px] font-bold">
            {formatRupiahCompact(summary.pengeluaran)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start mt-6">
        
        <div className="flex flex-col gap-6">

          <div className="bg-[#555555] bg-[linear-gradient(260deg,rgba(0,0,0,0.2)_60%,rgba(153,153,153,0.2)_100%)] rounded-[18px] p-6 border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-['Inter',_sans-serif] text-[16px] font-medium text-white m-0">Pemasukan {selectedYear}</h3>
              <select 
                className="bg-[#8f8f8f] text-white border-none py-1 px-3 rounded-lg font-['Inter',_sans-serif] text-[14px] outline-none cursor-pointer"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {[2026, 2025, 2024, 2023].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData.pemasukan} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={true} 
                    tickLine={false} 
                    tick={{ fill: 'white', fontSize: 13, fontFamily: 'Inter' }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={true} 
                    tickLine={false} 
                    tick={{ fill: 'white', fontSize: 13, fontFamily: 'Inter' }} 
                    tickFormatter={v => v >= 1000000 ? `${v/1000000}jt` : `${v/1000}k`} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} name="Pemasukan" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#555555] bg-[linear-gradient(260deg,rgba(0,0,0,0.2)_60%,rgba(153,153,153,0.2)_100%)] rounded-[18px] p-6 border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-['Inter',_sans-serif] text-[16px] font-medium text-white m-0">Pengeluaran {selectedYear}</h3>
              <select 
                className="bg-[#8f8f8f] text-white border-none py-1 px-3 rounded-lg font-['Inter',_sans-serif] text-[14px] outline-none cursor-pointer"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {[2026, 2025, 2024, 2023].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData.pengeluaran} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={true} 
                    tickLine={false} 
                    tick={{ fill: 'white', fontSize: 13, fontFamily: 'Inter' }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={true} 
                    tickLine={false} 
                    tick={{ fill: 'white', fontSize: 13, fontFamily: 'Inter' }} 
                    tickFormatter={v => v >= 1000000 ? `${v/1000000}jt` : `${v/1000}k`} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} name="Pengeluaran" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="bg-[#555555] bg-[linear-gradient(260deg,rgba(0,0,0,0.2)_60%,rgba(153,153,153,0.2)_100%)] rounded-[18px] p-6 border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative h-[500px] lg:h-[850px] flex flex-col">
            <h3 className="font-['Inter',_sans-serif] text-[16px] font-medium text-white m-0 mb-4">Wishlist</h3>
            
            {wishlists.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white/50">
                <p className="mb-4">Belum ada wishlist</p>
                <button 
                  onClick={() => navigate('/wishlist')}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition"
                >
                  Tambah Wishlist
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 overflow-y-auto pr-3 flex-1 
                [&::-webkit-scrollbar]:w-[6px] 
                [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-track]:rounded-[10px] 
                [&::-webkit-scrollbar-thumb]:bg-white/40 [&::-webkit-scrollbar-thumb]:rounded-[10px] hover:[&::-webkit-scrollbar-thumb]:bg-white/50
                [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.4)_rgba(255,255,255,0.1)]"
              >
                {wishlists.slice(0, 5).map(item => {
                  const progress = calculateProgress(item.saved_amount, item.target_amount)
                  return (
                    <div key={item.id} className="bg-gray-800 rounded-xl p-4 text-white shrink-0 shadow-md">
                      <h4 className="text-[15px] font-medium m-0 mb-3 font-['Inter',_sans-serif] text-white/90 truncate">{item.name}</h4>
                      <div className="text-[13px] leading-relaxed text-white/60 space-y-1">
                        <div className="flex justify-between items-center">
                          <span>Target:</span> 
                          <span className="font-mono text-white/90">{formatRupiahCompact(item.target_amount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Terkumpul:</span> 
                          <span className="font-mono text-emerald-400">{formatRupiahCompact(item.saved_amount)}</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-[11px] mb-1.5">
                          <span className="text-white/50">Progress</span>
                          <span className="font-medium text-white/80">{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button 
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-md px-4 py-1.5 text-[11px] cursor-pointer transition-colors font-medium hover:text-white" 
                          onClick={() => navigate('/wishlist')}
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}