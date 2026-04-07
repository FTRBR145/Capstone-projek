import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { transactionService } from '../services/transactionService'
import { wishlistService } from '../services/wishlistService'
import { formatRupiah, formatDate, getTodayISO } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import Footer from '../components/layout/Footer'
import LoadingSpinner from '../components/ui/LoadingSpinner'

// Fungsi format rupiah untuk input
const formatRupiahInput = (value) => {
  if (!value) return ''
  
  // Hanya ambil angka
  const number = value.toString().replace(/[^,\d]/g, '')
  const split = number.split(',')
  let sisa = split[0].length % 3
  let rupiah = split[0].substr(0, sisa)
  const ribuan = split[0].substr(sisa).match(/\d{3}/gi)
  
  if (ribuan) {
    const separator = sisa ? '.' : ''
    rupiah += separator + ribuan.join('.')
  }
  
  rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah
  return rupiah
}

// Fungsi parse dari format rupiah ke angka
const parseRupiahToNumber = (rupiahString) => {
  if (!rupiahString) return 0
  return parseInt(rupiahString.replace(/[^,\d]/g, '')) || 0
}

export default function Saldo() {
  const toast = useToast()
  
  const [loading, setLoading] = useState(true)
  const [pemasukan, setPemasukan] = useState([])
  const [pengeluaran, setPengeluaran] = useState([])
  const [summary, setSummary] = useState({ saldo: 0, pemasukan: 0, pengeluaran: 0 })
  const [wishlists, setWishlists] = useState([])
  
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [pemasukanMonth, setPemasukanMonth] = useState(currentMonth)
  const [pengeluaranMonth, setPengeluaranMonth] = useState(currentMonth)
  
  // Pagination states
  const [pemasukanPage, setPemasukanPage] = useState(1)
  const [pengeluaranPage, setPengeluaranPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  
  // Sorting states
  const [pemasukanSort, setPemasukanSort] = useState({ column: 'transaction_date', direction: 'desc' })
  const [pengeluaranSort, setPengeluaranSort] = useState({ column: 'transaction_date', direction: 'desc' })
  
  // Search states
  const [searchPemasukan, setSearchPemasukan] = useState('')
  const [searchPengeluaran, setSearchPengeluaran] = useState('')
  
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('pemasukan')
  const [editItem, setEditItem] = useState(null)
  const [formData, setFormData] = useState({
    date: getTodayISO(),
    amount: '',
    description: '',
    wishlistId: ''
  })
  const [amountDisplay, setAmountDisplay] = useState('')

  // Reset page when month or search changes
  useEffect(() => {
    setPemasukanPage(1)
  }, [pemasukanMonth, searchPemasukan])

  useEffect(() => {
    setPengeluaranPage(1)
  }, [pengeluaranMonth, searchPengeluaran])

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    if (!loading) {
      fetchTransactions()
    }
  }, [pemasukanMonth, pengeluaranMonth])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [summaryRes, pemasukanRes, pengeluaranRes, wishlistRes] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getTransactions({ type: 'pemasukan', month: pemasukanMonth }),
        transactionService.getTransactions({ type: 'pengeluaran', month: pengeluaranMonth }),
        wishlistService.getWishlists()
      ])
      
      setSummary(summaryRes.data)
      setPemasukan(pemasukanRes.data)
      setPengeluaran(pengeluaranRes.data)
      setWishlists(wishlistRes.data)
    } catch (error) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      const [pemasukanRes, pengeluaranRes] = await Promise.all([
        transactionService.getTransactions({ type: 'pemasukan', month: pemasukanMonth }),
        transactionService.getTransactions({ type: 'pengeluaran', month: pengeluaranMonth })
      ])
      setPemasukan(pemasukanRes.data)
      setPengeluaran(pengeluaranRes.data)
    } catch (error) {
      toast.error('Gagal memuat transaksi')
    }
  }

  const openAddModal = (type) => {
    setModalType(type)
    setEditItem(null)
    setFormData({
      date: getTodayISO(),
      amount: '',
      description: '',
      wishlistId: ''
    })
    setAmountDisplay('')
    setModalOpen(true)
  }

  const openEditModal = (type, item) => {
    setModalType(type)
    setEditItem(item)
    setFormData({
      date: item.transaction_date,
      amount: item.amount.toString(),
      description: item.description,
      wishlistId: ''
    })
    setAmountDisplay(formatRupiahInput(item.amount.toString()))
    setModalOpen(true)
  }

  // Handler untuk input nominal dengan format rupiah
  const handleAmountChange = (e) => {
    const rawValue = e.target.value
    const formatted = formatRupiahInput(rawValue)
    const numericValue = parseRupiahToNumber(formatted)
    
    setAmountDisplay(formatted)
    setFormData({ ...formData, amount: numericValue.toString() })
  }

  const updateWishlistManually = async (wishlistId, type, amount) => {
    if (!wishlistId) return null
    
    const wishlist = wishlists.find(w => w.id === parseInt(wishlistId))
    if (!wishlist) return null
    
    const currentSaved = wishlist.saved_amount
    let newSavedAmount
    
    // Saat user memilih hubungkan ke wishlist, baik itu dari Pemasukan maupun Pengeluaran,
    // itu berarti user sedang MENAMBAH tabungannya ke wishlist tersebut.
    newSavedAmount = currentSaved + amount
    try {
      await wishlistService.updateWishlist(wishlistId, {
        name: wishlist.name,
        targetAmount: wishlist.target_amount,
        savedAmount: newSavedAmount
      })
      
      return {
        name: wishlist.name,
        oldAmount: currentSaved,
        newAmount: newSavedAmount
      }
    } catch (error) {
      console.error('Gagal update wishlist:', error)
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const amount = parseInt(formData.amount)
    if (!amount || amount <= 0) {
      toast.error('Nominal harus lebih dari 0')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Keterangan harus diisi')
      return
    }

    if (modalType === 'pengeluaran' && !editItem && amount > summary.saldo) {
      toast.error('Saldo tidak cukup!')
      return
    }

    setLoading(true)
    try {
      const data = {
        type: modalType,
        amount,
        description: formData.description.trim(),
        transactionDate: formData.date
      }

      if (editItem) {
        await transactionService.updateTransaction(editItem.id, data)
        toast.success(`${modalType} berhasil diupdate`)
      } else {
        await transactionService.createTransaction(data)
        toast.success(`${modalType} berhasil ditambahkan`)
        
        if (formData.wishlistId) {
          try {
            const result = await updateWishlistManually(
              formData.wishlistId, 
              modalType, 
              amount
            )
            
            if (result) {
              toast.success(
                `Tabungan "${result.name}" terupdate: ` +
                `Rp ${formatRupiah(result.oldAmount)} → Rp ${formatRupiah(result.newAmount)}`
              )
            }
          } catch (error) {
            toast.error('Gagal update wishlist, tapi transaksi tetap tersimpan')
          }
        }
      }

      setModalOpen(false)
      await fetchAllData()
      await fetchWishlists()
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  const fetchWishlists = async () => {
    try {
      const res = await wishlistService.getWishlists()
      setWishlists(res.data)
    } catch (error) {
      console.error('Gagal fetch wishlist:', error)
    }
  }

  const handleDelete = async (type, id) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini?')) return

    setLoading(true)
    try {
      await transactionService.deleteTransaction(id)
      toast.success('Transaksi berhasil dihapus')
      await fetchAllData()
    } catch (error) {
      toast.error('Gagal menghapus transaksi')
    } finally {
      setLoading(false)
    }
  }

  const monthOptions = () => {
    const options = []
    for (let i = 0; i < 6; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const value = `${year}-${month}`
      const label = new Intl.DateTimeFormat('id-ID', { 
        month: 'long', 
        year: 'numeric' 
      }).format(date)
      options.push({ value, label })
    }
    return options
  }

  // Fungsi sorting
  const sortData = (data, sortConfig) => {
    if (!sortConfig.column) return data
    
    return [...data].sort((a, b) => {
      let aVal = a[sortConfig.column]
      let bVal = b[sortConfig.column]
      
      if (sortConfig.column === 'transaction_date') {
        aVal = new Date(aVal)
        bVal = new Date(bVal)
      }
      
      if (sortConfig.column === 'amount') {
        aVal = Number(aVal)
        bVal = Number(bVal)
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  // Fungsi filter search
  const filterData = (data, search) => {
    if (!search) return data
    return data.filter(item => 
      item.description.toLowerCase().includes(search.toLowerCase())
    )
  }

  // Fungsi pagination
  const paginateData = (data, page, rowsPerPageValue) => {
    const start = (page - 1) * rowsPerPageValue
    const end = start + rowsPerPageValue
    return data.slice(start, end)
  }

  // Render header dengan sorting
  const renderSortHeader = (label, column, sortConfig, setSortConfig) => {
    const isActive = sortConfig.column === column
    return (
      <th 
        className="p-3 text-left cursor-pointer hover:bg-gray-600 transition select-none"
        onClick={() => {
          if (isActive) {
            setSortConfig({
              column,
              direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
            })
          } else {
            setSortConfig({ column, direction: 'asc' })
          }
        }}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive && (
            <span className="text-xs">
              {sortConfig.direction === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </div>
      </th>
    )
  }

  // Komponen Table
  const TableSection = ({ 
    data, 
    type, 
    selectedMonth, 
    setMonth,
    page, 
    setPage, 
    sortConfig, 
    setSortConfig, 
    search, 
    setSearch 
  }) => {
    const filtered = filterData(data, search)
    const sorted = sortData(filtered, sortConfig)
    const totalItems = sorted.length
    const totalPages = Math.ceil(totalItems / rowsPerPage)
    const paginatedData = paginateData(sorted, page, rowsPerPage)
    
    return (
      <div className="bg-[#555555] rounded-[18px] p-6 shadow-lg mt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h3 className="text-xl font-medium text-white capitalize">{type}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openAddModal(type)}
              className="bg-emerald-600 text-white px-3 py-1 rounded-full hover:bg-emerald-700 transition"
            >
              + Tambah
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1 rounded-lg"
            >
              {monthOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder={`Cari ${type}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 bg-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead className="bg-gray-700">
              <tr>
                {renderSortHeader('Tanggal', 'transaction_date', sortConfig, setSortConfig)}
                {renderSortHeader('Nominal', 'amount', sortConfig, setSortConfig)}
                {renderSortHeader('Keterangan', 'description', sortConfig, setSortConfig)}
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-8 text-gray-400">
                    Belum ada data {type}
                  </td>
                </tr>
              ) : (
                paginatedData.map(item => (
                  <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-600 transition">
                    <td className="p-3">{formatDate(item.transaction_date)}</td>
                    <td className="p-3 font-mono">
                      Rp {formatRupiah(item.amount)}
                    </td>
                    <td className="p-3">{item.description}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openEditModal(type, item)}
                        className="text-blue-400 hover:text-blue-300 mr-2 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(type, item.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Baris per halaman:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 transition"
              >
                «
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-2 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 transition"
              >
                ‹
              </button>
              <span className="text-sm">
                Halaman {page} dari {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-2 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 transition"
              >
                ›
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-2 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 transition"
              >
                »
              </button>
            </div>
            
            <div className="text-sm text-gray-300">
              Menampilkan {((page-1) * rowsPerPage) + 1} - {Math.min(page * rowsPerPage, totalItems)} dari {totalItems} data
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading && !modalOpen) {
    return <LoadingSpinner />
  }

  return (
    <div className="text-white p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-600 rounded-xl p-6">
          <p className="text-sm opacity-90">Total Saldo</p>
          <p className="text-2xl font-bold">Rp {formatRupiah(summary.saldo)}</p>
        </div>
        <div className="bg-blue-600 rounded-xl p-6">
          <p className="text-sm opacity-90">Total Pemasukan</p>
          <p className="text-2xl font-bold">Rp {formatRupiah(summary.pemasukan)}</p>
        </div>
        <div className="bg-red-600 rounded-xl p-6">
          <p className="text-sm opacity-90">Total Pengeluaran</p>
          <p className="text-2xl font-bold">Rp {formatRupiah(summary.pengeluaran)}</p>
        </div>
      </div>

      {/* Tables */}
      <TableSection
        data={pemasukan}
        type="pemasukan"
        selectedMonth={pemasukanMonth}
        setMonth={setPemasukanMonth}
        page={pemasukanPage}
        setPage={setPemasukanPage}
        sortConfig={pemasukanSort}
        setSortConfig={setPemasukanSort}
        search={searchPemasukan}
        setSearch={setSearchPemasukan}
      />
      
      <TableSection
        data={pengeluaran}
        type="pengeluaran"
        selectedMonth={pengeluaranMonth}
        setMonth={setPengeluaranMonth}
        page={pengeluaranPage}
        setPage={setPengeluaranPage}
        sortConfig={pengeluaranSort}
        setSortConfig={setPengeluaranSort}
        search={searchPengeluaran}
        setSearch={setSearchPengeluaran}
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${editItem ? 'Edit' : 'Tambah'} ${modalType}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nominal
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                Rp
              </span>
              <input
                type="text"
                value={amountDisplay}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>
          
          {!editItem && wishlists.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Hubungkan ke Wishlist (Opsional)
              </label>
              <select
                value={formData.wishlistId}
                onChange={(e) => setFormData({...formData, wishlistId: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
              >
                <option value="">-- Pilih Wishlist --</option>
                {wishlists.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Rp {formatRupiah(w.saved_amount)} / Rp {formatRupiah(w.target_amount)})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Pilih wishlist untuk update tabungan otomatis
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Keterangan
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
              rows="3"
              placeholder="Contoh: Nabung buat Laptop"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  )
}