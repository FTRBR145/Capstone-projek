import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { transactionService } from '../services/transactionService'
import { formatRupiah, formatDateFull, getMonthName } from '../utils/helpers'
import Footer from '../components/layout/Footer'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export default function Report() {
  const { user } = useAuth()
  const toast = useToast()
  const chartRef = useRef(null)
  
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [summary, setSummary] = useState({
    pemasukan: 0,
    pengeluaran: 0,
    saldo: 0,
    total_transactions_pemasukan: 0,
    total_transactions_pengeluaran: 0
  })
  const [transactions, setTransactions] = useState([])
  const [chartData, setChartData] = useState([])
  const [yearlyData, setYearlyData] = useState(null)

  const monthOptions = () => {
    const options = []
    const currentDate = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate)
      date.setMonth(currentDate.getMonth() - i)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const value = `${year}-${month}`
      const label = `${getMonthName(date.getMonth())} ${year}`
      options.push({ value, label })
    }
    return options
  }

  useEffect(() => {
    fetchMonthlyReport()
  }, [selectedMonth])

  const fetchMonthlyReport = async () => {
    setLoading(true)
    try {
      const summaryRes = await transactionService.getSummary(selectedMonth)
      setSummary(summaryRes.data)

      const transactionsRes = await transactionService.getTransactions({
        startDate: `${selectedMonth}-01`,
        endDate: `${selectedMonth}-${new Date(selectedMonth.split('-')[0], selectedMonth.split('-')[1], 0).getDate()}`
      })
      
      const sortedTransactions = transactionsRes.data.sort((a, b) => 
        new Date(b.transaction_date) - new Date(a.transaction_date)
      )
      setTransactions(sortedTransactions)

      const dailyMap = new Map()
      sortedTransactions.forEach(trans => {
        const day = new Date(trans.transaction_date).getDate()
        if (!dailyMap.has(day)) {
          dailyMap.set(day, { pemasukan: 0, pengeluaran: 0 })
        }
        const current = dailyMap.get(day)
        if (trans.type === 'pemasukan') {
          current.pemasukan += trans.amount
        } else {
          current.pengeluaran += trans.amount
        }
      })

      const dailyChartData = Array.from(dailyMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([day, data]) => ({
          day,
          pemasukan: data.pemasukan,
          pengeluaran: data.pengeluaran
        }))
      
      setChartData(dailyChartData)

      const year = selectedMonth.split('-')[0]
      const yearlyTransactions = await transactionService.getTransactions({
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`
      })
      
      const monthlyMap = new Map()
      yearlyTransactions.data.forEach(trans => {
        const month = new Date(trans.transaction_date).getMonth() + 1
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { pemasukan: 0, pengeluaran: 0 })
        }
        const current = monthlyMap.get(month)
        if (trans.type === 'pemasukan') {
          current.pemasukan += trans.amount
        } else {
          current.pengeluaran += trans.amount
        }
      })
      
      const monthlyYearlyData = Array.from({ length: 12 }, (_, i) => {
        const monthData = monthlyMap.get(i + 1) || { pemasukan: 0, pengeluaran: 0 }
        return {
          month: getMonthName(i),
          pemasukan: monthData.pemasukan,
          pengeluaran: monthData.pengeluaran,
          isCurrentMonth: i + 1 === parseInt(selectedMonth.split('-')[1])
        }
      })
      
      setYearlyData(monthlyYearlyData)

    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error('Gagal memuat laporan bulanan')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryData = () => {
    const categories = new Map()
    transactions.forEach(trans => {
      if (trans.type === 'pengeluaran') {
        const existing = categories.get(trans.description) || 0
        categories.set(trans.description, existing + trans.amount)
      }
    })
    
    return Array.from(categories.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const selectedDate = new Date(selectedMonth.split('-')[0], parseInt(selectedMonth.split('-')[1]) - 1)
      const monthName = getMonthName(selectedDate.getMonth())
      const year = selectedDate.getFullYear()
      
      doc.setFontSize(20)
      doc.setTextColor(0, 0, 0)
      doc.text(`Laporan Keuangan ${monthName} ${year}`, 14, 20)
      
      doc.setFontSize(11)
      doc.setTextColor(100, 100, 100)
      doc.text(`Nama: ${user?.name || 'Pengguna'}`, 14, 30)
      doc.text(`Email: ${user?.email || '-'}`, 14, 36)
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 42)
      
      const summaryData = [
        ['Total Pemasukan', `Rp ${formatRupiah(summary.pemasukan)}`],
        ['Total Pengeluaran', `Rp ${formatRupiah(summary.pengeluaran)}`],
        ['Saldo Akhir', `Rp ${formatRupiah(summary.saldo)}`],
        ['Jumlah Transaksi Pemasukan', summary.total_transactions_pemasukan.toString()],
        ['Jumlah Transaksi Pengeluaran', summary.total_transactions_pengeluaran.toString()],
      ]
      
      autoTable(doc, {
        startY: 48,
        head: [['Deskripsi', 'Nilai']],
        body: summaryData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 11 },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      })
      
      let finalY = doc.lastAutoTable?.finalY || 58
      finalY = finalY + 10
      
      if (transactions.length > 0) {
        const transactionData = transactions.map(t => [
          formatDateFull(t.transaction_date),
          t.description,
          t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
          `Rp ${formatRupiah(t.amount)}`
        ])
        
        autoTable(doc, {
          startY: finalY,
          head: [['Tanggal', 'Keterangan', 'Tipe', 'Nominal']],
          body: transactionData,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [34, 197, 94], textColor: 255, fontSize: 10 },
          alternateRowStyles: { fillColor: [250, 250, 250] }
        })
        
        finalY = doc.lastAutoTable?.finalY || finalY
        finalY = finalY + 10
      }
      
      const categoryData = getCategoryData()
      if (categoryData.length > 0) {
        const categoryTableData = categoryData.map(c => [
          c.name,
          `Rp ${formatRupiah(c.value)}`,
          `${((c.value / summary.pengeluaran) * 100).toFixed(1)}%`
        ])
        
        autoTable(doc, {
          startY: finalY,
          head: [['Kategori', 'Total', 'Persentase']],
          body: categoryTableData,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [239, 68, 68], textColor: 255, fontSize: 10 },
          alternateRowStyles: { fillColor: [250, 250, 250] }
        })
      }
      
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `TabunganQu - Laporan Bulanan | Halaman ${i} dari ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
      }
      
      doc.save(`Laporan_${monthName}_${year}.pdf`)
      toast.success('PDF berhasil diexport! 📄')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Gagal export PDF')
    }
  }

  const exportToExcel = () => {
    try {
      const selectedDate = new Date(selectedMonth.split('-')[0], parseInt(selectedMonth.split('-')[1]) - 1)
      const monthName = getMonthName(selectedDate.getMonth())
      const year = selectedDate.getFullYear()
      
      const wb = XLSX.utils.book_new()
      
      const summarySheetData = [
        ['Laporan Keuangan', `${monthName} ${year}`],
        [''],
        ['Nama', user?.name || 'Pengguna'],
        ['Email', user?.email || '-'],
        ['Tanggal Cetak', new Date().toLocaleDateString('id-ID')],
        [''],
        ['Ringkasan Keuangan'],
        ['Deskripsi', 'Nilai'],
        ['Total Pemasukan', summary.pemasukan],
        ['Total Pengeluaran', summary.pengeluaran],
        ['Saldo Akhir', summary.saldo],
        ['Jumlah Transaksi Pemasukan', summary.total_transactions_pemasukan],
        ['Jumlah Transaksi Pengeluaran', summary.total_transactions_pengeluaran],
        [''],
        ['Rata-rata Pengeluaran per Transaksi', summary.total_transactions_pengeluaran > 0 
          ? Math.round(summary.pengeluaran / summary.total_transactions_pengeluaran) 
          : 0]
      ]
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData)
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan')
      
      if (transactions.length > 0) {
        const transactionSheetData = [
          ['Detail Transaksi', `${monthName} ${year}`],
          [''],
          ['Tanggal', 'Keterangan', 'Tipe', 'Nominal', 'Nominal (Rp)']
        ]
        
        transactions.forEach(t => {
          transactionSheetData.push([
            formatDateFull(t.transaction_date),
            t.description,
            t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
            `Rp ${formatRupiah(t.amount)}`,
            t.amount
          ])
        })
        
        const transactionSheet = XLSX.utils.aoa_to_sheet(transactionSheetData)
        transactionSheet['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 15 }]
        XLSX.utils.book_append_sheet(wb, transactionSheet, 'Transaksi')
      }
      
      const categoryData = getCategoryData()
      if (categoryData.length > 0) {
        const categorySheetData = [
          ['Analisis Kategori Pengeluaran', `${monthName} ${year}`],
          [''],
          ['Kategori', 'Total Pengeluaran (Rp)', 'Total Pengeluaran', 'Persentase']
        ]
        
        categoryData.forEach(c => {
          const percentage = ((c.value / summary.pengeluaran) * 100).toFixed(1)
          categorySheetData.push([
            c.name,
            c.value,
            `Rp ${formatRupiah(c.value)}`,
            `${percentage}%`
          ])
        })
        
        categorySheetData.push([''], ['Total Keseluruhan', summary.pengeluaran, `Rp ${formatRupiah(summary.pengeluaran)}`, '100%'])
        
        const categorySheet = XLSX.utils.aoa_to_sheet(categorySheetData)
        categorySheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 12 }]
        XLSX.utils.book_append_sheet(wb, categorySheet, 'Analisis Kategori')
      }
      
      if (chartData.length > 0) {
        const dailySheetData = [
          ['Ringkasan Harian', `${monthName} ${year}`],
          [''],
          ['Tanggal', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Saldo Harian']
        ]
        
        let runningBalance = 0
        chartData.forEach(day => {
          runningBalance += day.pemasukan - day.pengeluaran
          dailySheetData.push([
            `${day.day}`,
            day.pemasukan,
            day.pengeluaran,
            runningBalance
          ])
        })
        
        const dailySheet = XLSX.utils.aoa_to_sheet(dailySheetData)
        dailySheet['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 }]
        XLSX.utils.book_append_sheet(wb, dailySheet, 'Ringkasan Harian')
      }
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(data, `Laporan_${monthName}_${year}.xlsx`)
      
      toast.success('Excel berhasil diexport! 📊')
    } catch (error) {
      console.error('Error exporting Excel:', error)
      toast.error('Gagal export Excel')
    }
  }

  const pieColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#2A2A2A] py-2 px-3 rounded-lg shadow-lg text-white text-sm">
          <p className="font-semibold mb-1">Tanggal: {label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name === 'Pemasukan' ? '💰 Pemasukan' : '📉 Pengeluaran'}: Rp {formatRupiah(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const selectedDate = new Date(selectedMonth.split('-')[0], parseInt(selectedMonth.split('-')[1]) - 1)
  const monthName = getMonthName(selectedDate.getMonth())
  const year = selectedDate.getFullYear()
  const categoryData = getCategoryData()

  return (
    <div className="text-white pb-10 animate-fade-in font-['Inter',_sans-serif]">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-[28px] md:text-[32px] font-normal text-white m-0">
              Laporan Bulanan
            </h2>
            <p className="text-white/60 text-sm mt-1">
              Ringkasan transaksi dan analisis keuangan
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={exportToPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
            <button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[#8f8f8f] text-white border-none py-2 px-4 rounded-lg font-['Inter',_sans-serif] text-[14px] outline-none cursor-pointer"
            >
              {monthOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-5">
            <p className="text-sm opacity-90">Saldo Akhir</p>
            <p className="text-2xl font-bold">Rp {formatRupiah(summary.saldo)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5">
            <p className="text-sm opacity-90">Total Pemasukan</p>
            <p className="text-2xl font-bold">Rp {formatRupiah(summary.pemasukan)}</p>
            <p className="text-xs opacity-75 mt-1">{summary.total_transactions_pemasukan} transaksi</p>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-5">
            <p className="text-sm opacity-90">Total Pengeluaran</p>
            <p className="text-2xl font-bold">Rp {formatRupiah(summary.pengeluaran)}</p>
            <p className="text-xs opacity-75 mt-1">{summary.total_transactions_pengeluaran} transaksi</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5">
            <p className="text-sm opacity-90">Rata-rata Pengeluaran</p>
            <p className="text-2xl font-bold">
              Rp {formatRupiah(summary.total_transactions_pengeluaran > 0 
                ? Math.round(summary.pengeluaran / summary.total_transactions_pengeluaran) 
                : 0)}
            </p>
            <p className="text-xs opacity-75 mt-1">per transaksi</p>
          </div>
        </div>

        <div className="bg-[#555555] bg-[linear-gradient(260deg,rgba(0,0,0,0.2)_60%,rgba(153,153,153,0.2)_100%)] rounded-[18px] p-6 mb-6 border border-white/5">
          <h3 className="text-[18px] font-medium text-white mb-4">
            Grafik Harian - {monthName} {year}
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis 
                  dataKey="day" 
                  axisLine={true} 
                  tickLine={false} 
                  tick={{ fill: 'white', fontSize: 12 }} 
                  label={{ value: 'Tanggal', position: 'insideBottom', offset: -15, fill: 'white' }}
                />
                <YAxis 
                  axisLine={true} 
                  tickLine={false} 
                  tick={{ fill: 'white', fontSize: 12 }}
                  tickFormatter={v => v >= 1000000 ? `${v/1000000}jt` : `${v/1000}k`}
                  label={{ value: 'Nominal (Rp)', angle: -90, position: 'insideLeft', fill: 'white' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} name="Pemasukan" />
                <Bar dataKey="pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {yearlyData && (
          <div className="bg-[#555555] bg-[linear-gradient(260deg,rgba(0,0,0,0.2)_60%,rgba(153,153,153,0.2)_100%)] rounded-[18px] p-6 mb-6 border border-white/5">
            <h3 className="text-[18px] font-medium text-white mb-4">
              Perbandingan Bulanan - {year}
            </h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={true} 
                    tickLine={false} 
                    tick={{ fill: 'white', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={true} 
                    tickLine={false} 
                    tick={{ fill: 'white', fontSize: 12 }}
                    tickFormatter={v => v >= 1000000 ? `${v/1000000}jt` : `${v/1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar 
                    dataKey="pemasukan" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                    name="Pemasukan"
                    opacity={(data) => data.isCurrentMonth ? 1 : 0.6}
                  />
                  <Bar 
                    dataKey="pengeluaran" 
                    fill="#ef4444" 
                    radius={[4, 4, 0, 0]} 
                    name="Pengeluaran"
                    opacity={(data) => data.isCurrentMonth ? 1 : 0.6}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-white/50 text-xs text-center mt-2">
              *Bulan ini ditandai dengan warna lebih terang
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#555555] bg-[linear-gradient(260deg,rgba(0,0,0,0.2)_60%,rgba(153,153,153,0.2)_100%)] rounded-[18px] p-6 border border-white/5">
            <h3 className="text-[18px] font-medium text-white mb-4">
              Kategori Pengeluaran
            </h3>
            {categoryData.length === 0 ? (
              <div className="text-center text-white/50 py-12">
                Belum ada data pengeluaran
              </div>
            ) : (
              <>
                <div className="w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `Rp ${formatRupiah(value)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {categoryData.map((cat, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }}></div>
                        <span>{cat.name}</span>
                      </div>
                      <span className="font-mono">Rp {formatRupiah(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="bg-[#555555] bg-[linear-gradient(260deg,rgba(0,0,0,0.2)_60%,rgba(153,153,153,0.2)_100%)] rounded-[18px] p-6 border border-white/5">
            <h3 className="text-[18px] font-medium text-white mb-4">
              Detail Transaksi
            </h3>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center text-white/50 py-12">
                  Belum ada transaksi bulan ini
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#666666]">
                    <tr>
                      <th className="text-left py-2 px-3">Tanggal</th>
                      <th className="text-left py-2 px-3">Keterangan</th>
                      <th className="text-right py-2 px-3">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(trans => (
                      <tr key={trans.id} className="border-t border-white/10">
                        <td className="py-2 px-3">{formatDateFull(trans.transaction_date)}</td>
                        <td className="py-2 px-3">{trans.description}</td>
                        <td className={`py-2 px-3 text-right font-mono ${trans.type === 'pemasukan' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trans.type === 'pemasukan' ? '+' : '-'} Rp {formatRupiah(trans.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}