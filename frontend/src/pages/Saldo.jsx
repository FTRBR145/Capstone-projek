import { useState, useEffect, useMemo } from 'react'
import { useToast } from '../context/ToastContext'
import { transactionService } from '../services/transactionService'
import { wishlistService } from '../services/wishlistService'
import { DEBUG_MODE } from '../config/debugMode'
import { DUMMY_SUMMARY, DUMMY_PEMASUKAN, DUMMY_PENGELUARAN, DUMMY_WISHLIST } from '../data/dummyData'
import { formatRupiah, formatDate, getTodayISO } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import Footer from '../components/layout/Footer'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/* ─── Helpers ─────────────────────────────────────────── */
const formatRupiahInput = (value) => {
  if (!value) return ''
  const number = value.toString().replace(/[^,\d]/g, '')
  const split = number.split(',')
  let sisa = split[0].length % 3
  let rupiah = split[0].substr(0, sisa)
  const ribuan = split[0].substr(sisa).match(/\d{3}/gi)
  if (ribuan) rupiah += (sisa ? '.' : '') + ribuan.join('.')
  return split[1] !== undefined ? rupiah + ',' + split[1] : rupiah
}
const parseRupiahToNumber = (s) => parseInt((s || '').replace(/[^,\d]/g, '')) || 0

const getMonthOptions = () => {
  const opts = []
  for (let i = 0; i < 12; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    opts.push({ value: v, label: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d) })
  }
  return opts
}

/** Build running balance per transaction id from a combined array */
function buildRunningBalance(allTrans) {
  const sorted = [...allTrans].sort((a, b) => {
    const da = new Date(a.transaction_date).getTime()
    const db = new Date(b.transaction_date).getTime()
    if (da !== db) return da - db
    return (a.id ?? 0) - (b.id ?? 0)
  })
  let bal = 0
  const map = new Map()
  for (const t of sorted) {
    bal += t.type === 'pemasukan' ? t.amount : -t.amount
    map.set(t.id, bal)
  }
  return map
}

/* ─── Sort / filter / paginate ─── */
const sortData = (data, cfg) => {
  if (!cfg.column) return data
  return [...data].sort((a, b) => {
    let av = a[cfg.column], bv = b[cfg.column]
    if (cfg.column === 'transaction_date') { av = new Date(av); bv = new Date(bv) }
    if (cfg.column === 'amount') { av = Number(av); bv = Number(bv) }
    if (av < bv) return cfg.direction === 'asc' ? -1 : 1
    if (av > bv) return cfg.direction === 'asc' ? 1 : -1
    return 0
  })
}
const filterData = (data, q) => !q ? data : data.filter(i => i.description.toLowerCase().includes(q.toLowerCase()))
const paginate = (data, page, rpp) => data.slice((page - 1) * rpp, page * rpp)

/* ─── Sort header ─── */
const SortTh = ({ label, col, cfg, setC }) => {
  const active = cfg.column === col
  return (
    <th
      className="px-3 py-2.5 text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider cursor-pointer select-none hover:text-white/70 transition whitespace-nowrap"
      onClick={() => setC({ column: col, direction: active && cfg.direction === 'asc' ? 'desc' : 'asc' })}
    >
      {label} {active && <span className="text-white/60">{cfg.direction === 'asc' ? '↑' : '↓'}</span>}
    </th>
  )
}

/* ─── Table section ─── */
const TableSection = ({ data, type, allTrans, selectedMonth, setMonth, page, setPage, sortCfg, setSortCfg, search, setSearch, rpp, setRpp, onAdd, onEdit, onDelete }) => {
  const balMap = useMemo(() => buildRunningBalance(allTrans), [allTrans])
  const filtered = filterData(data, search)
  const sorted = sortData(filtered, sortCfg)
  const total = sorted.length
  const pages = Math.max(1, Math.ceil(total / rpp))
  const rows = paginate(sorted, page, rpp)
  const isIncome = type === 'pemasukan'

  return (
    <div className="tq-card p-4 min-[901px]:p-5 mt-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-5 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <h3 className="text-[14px] font-semibold text-white m-0 capitalize">
            {isIncome ? 'Pemasukan' : 'Pengeluaran'}
          </h3>
          <span className="text-[11px] text-white/35 bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-full">{total}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onAdd(type)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white transition-colors active:scale-[0.97] ${
              isIncome ? 'bg-emerald-600 hover:bg-emerald-500' : 'border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300'
            }`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tambah
          </button>
          <select
            value={selectedMonth}
            onChange={e => setMonth(e.target.value)}
            className="tq-field tq-select py-1.5 px-2.5 text-[12px]"
          >
            {getMonthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input type="text" placeholder={`Cari ${isIncome ? 'pemasukan' : 'pengeluaran'}...`}
          value={search} onChange={e => setSearch(e.target.value)}
          className="tq-field w-full sm:w-64 px-3 py-2 text-[12px]" />
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {rows.length === 0
          ? <div className="text-center py-10 text-[13px] text-white/35">Belum ada data</div>
          : rows.map(item => (
            <div key={item.id} className="tq-card-inner p-3.5">
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-[11px] text-white/40">{formatDate(item.transaction_date)}</span>
                <span className={`font-mono font-bold text-[13px] ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isIncome ? '+' : '-'} Rp {formatRupiah(item.amount)}
                </span>
              </div>
              <p className="text-[13px] text-white/85 mb-2 leading-snug">{item.description}</p>
              <div className="text-[11px] text-white/35 mb-2.5">
                Saldo: <span className="text-white/55 font-medium">Rp {formatRupiah(balMap.get(item.id) ?? 0)}</span>
              </div>
              <div className="flex justify-end gap-4 border-t border-white/[0.07] pt-2.5">
                <button onClick={() => onEdit(type, item)} className="text-[12px] font-medium text-blue-400 hover:text-blue-300 transition">Edit</button>
                <button onClick={() => onDelete(type, item.id)} className="text-[12px] font-medium text-red-400 hover:text-red-300 transition">Hapus</button>
              </div>
            </div>
          ))
        }
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/[0.07]">
        <table className="w-full min-w-[680px]">
          <thead className="bg-white/[0.04]">
            <tr>
              <SortTh label="Tanggal" col="transaction_date" cfg={sortCfg} setC={setSortCfg} />
              <SortTh label="Keterangan" col="description" cfg={sortCfg} setC={setSortCfg} />
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider">Jenis</th>
              {isIncome
                ? <SortTh label="Pemasukan" col="amount" cfg={sortCfg} setC={setSortCfg} />
                : <SortTh label="Pengeluaran" col="amount" cfg={sortCfg} setC={setSortCfg} />
              }
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider">Saldo Berjalan</th>
              <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-white/40 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.length === 0
              ? <tr><td colSpan={6} className="text-center py-10 text-[13px] text-white/35">Belum ada data</td></tr>
              : rows.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-3 py-3 text-[12px] text-white/70 whitespace-nowrap">{formatDate(item.transaction_date)}</td>
                  <td className="px-3 py-3 text-[13px] text-white/85 max-w-[220px] truncate">{item.description}</td>
                  <td className="px-3 py-3">
                    <span className={`tq-badge ${isIncome ? 'tq-badge-income' : 'tq-badge-expense'}`}>
                      {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                  </td>
                  <td className={`px-3 py-3 font-mono font-semibold text-[13px] ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isIncome ? '+' : '-'} Rp {formatRupiah(item.amount)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[12px] text-white/55">
                    Rp {formatRupiah(balMap.get(item.id) ?? 0)}
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <button onClick={() => onEdit(type, item)} className="text-[12px] text-blue-400 hover:text-blue-300 mr-3 transition">Edit</button>
                    <button onClick={() => onDelete(type, item.id)} className="text-[12px] text-red-400 hover:text-red-300 transition">Hapus</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-4 border-t border-white/[0.07]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/40">Baris:</span>
            <select value={rpp} onChange={e => { setRpp(Number(e.target.value)); setPage(1) }}
              className="tq-field tq-select py-1 px-2 text-[11px]">
              <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            {[['«', 1], ['‹', page - 1]].map(([lbl, t]) => (
              <button key={lbl} onClick={() => setPage(t)} disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.05] text-[12px] disabled:opacity-30 hover:bg-white/[0.09] transition">
                {lbl}
              </button>
            ))}
            <span className="text-[11px] text-white/40 px-2">{page}/{pages}</span>
            {[['›', page + 1], ['»', pages]].map(([lbl, t]) => (
              <button key={lbl} onClick={() => setPage(t)} disabled={page === pages}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.05] text-[12px] disabled:opacity-30 hover:bg-white/[0.09] transition">
                {lbl}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-white/35">{(page-1)*rpp+1}–{Math.min(page*rpp,total)} dari {total}</span>
        </div>
      )}
    </div>
  )
}

/* ─── Main component ──────────────────────────────────── */
export default function Saldo() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [pemasukan, setPemasukan] = useState([])
  const [pengeluaran, setPengeluaran] = useState([])
  const [allTrans, setAllTrans] = useState([])
  const [summary, setSummary] = useState({ saldo: 0, pemasukan: 0, pengeluaran: 0 })
  const [wishlists, setWishlists] = useState([])

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [pemasukanMonth, setPemasukanMonth] = useState(currentMonth)
  const [pengeluaranMonth, setPengeluaranMonth] = useState(currentMonth)

  const [pPage, setPPage] = useState(1)
  const [eePage, setEePage] = useState(1)
  const [rpp, setRpp] = useState(10)
  const [pSort, setPSort] = useState({ column: 'transaction_date', direction: 'desc' })
  const [eSort, setESort] = useState({ column: 'transaction_date', direction: 'desc' })
  const [pSearch, setPSearch] = useState('')
  const [eSearch, setESearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('pemasukan')
  const [editItem, setEditItem] = useState(null)
  const [formData, setFormData] = useState({ date: getTodayISO(), amount: '', description: '', wishlistId: '' })
  const [amountDisplay, setAmountDisplay] = useState('')

  useEffect(() => { setPPage(1) }, [pemasukanMonth, pSearch])
  useEffect(() => { setEePage(1) }, [pengeluaranMonth, eSearch])
  useEffect(() => { fetchAllData() }, [])
  useEffect(() => { if (!loading) fetchTransactions() }, [pemasukanMonth, pengeluaranMonth])

  const fetchAllData = async () => {
    setLoading(true)
    if (DEBUG_MODE.ENABLED) {
      setTimeout(() => {
        setSummary(DUMMY_SUMMARY)
        setPemasukan(DUMMY_PEMASUKAN)
        setPengeluaran(DUMMY_PENGELUARAN)
        setAllTrans([...DUMMY_PEMASUKAN, ...DUMMY_PENGELUARAN])
        setWishlists(DUMMY_WISHLIST)
        setLoading(false)
      }, 500)
      return
    }
    try {
      const [sumRes, pRes, eRes, wRes, allRes] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getTransactions({ type: 'pemasukan', month: pemasukanMonth }),
        transactionService.getTransactions({ type: 'pengeluaran', month: pengeluaranMonth }),
        wishlistService.getWishlists(),
        transactionService.getTransactions({})
      ])
      setSummary(sumRes.data)
      setPemasukan(pRes.data)
      setPengeluaran(eRes.data)
      setAllTrans(allRes.data || [])
      setWishlists(wRes.data)
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }

  const fetchTransactions = async () => {
    if (DEBUG_MODE.ENABLED) return
    try {
      const [pRes, eRes] = await Promise.all([
        transactionService.getTransactions({ type: 'pemasukan', month: pemasukanMonth }),
        transactionService.getTransactions({ type: 'pengeluaran', month: pengeluaranMonth })
      ])
      setPemasukan(pRes.data); setPengeluaran(eRes.data)
    } catch { toast.error('Gagal memuat transaksi') }
  }

  const openAddModal = (type) => {
    setModalType(type); setEditItem(null)
    setFormData({ date: getTodayISO(), amount: '', description: '', wishlistId: '' })
    setAmountDisplay(''); setModalOpen(true)
  }
  const openEditModal = (type, item) => {
    setModalType(type); setEditItem(item)
    setFormData({ date: item.transaction_date, amount: item.amount.toString(), description: item.description, wishlistId: '' })
    setAmountDisplay(formatRupiahInput(item.amount.toString())); setModalOpen(true)
  }

  const handleAmountChange = (e) => {
    const f = formatRupiahInput(e.target.value)
    setAmountDisplay(f); setFormData(p => ({ ...p, amount: parseRupiahToNumber(f).toString() }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = parseInt(formData.amount)
    if (!amount || amount <= 0) { toast.error('Nominal harus lebih dari 0'); return }
    if (!formData.description.trim()) { toast.error('Keterangan harus diisi'); return }
    if (modalType === 'pengeluaran' && !editItem && amount > summary.saldo) { toast.error('Saldo tidak cukup!'); return }

    setLoading(true)
    try {
      const data = { type: modalType, amount, description: formData.description.trim(), transactionDate: formData.date }
      if (editItem) {
        await transactionService.updateTransaction(editItem.id, data)
        toast.success(`${modalType} berhasil diupdate`)
      } else {
        await transactionService.createTransaction(data)
        toast.success(`${modalType} berhasil ditambahkan`)
        if (formData.wishlistId) {
          try {
            const w = wishlists.find(x => x.id === parseInt(formData.wishlistId))
            if (w) {
              const ns = w.saved_amount + amount
              await wishlistService.updateWishlist(formData.wishlistId, { name: w.name, targetAmount: w.target_amount, savedAmount: ns })
              toast.success(`Tabungan "${w.name}" diperbarui: Rp ${formatRupiah(w.saved_amount)} → Rp ${formatRupiah(ns)}`)
            }
          } catch { toast.error('Gagal update wishlist, transaksi tetap tersimpan') }
        }
      }
      setModalOpen(false)
      await fetchAllData()
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan') }
    finally { setLoading(false) }
  }

  const handleDelete = async (type, id) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini?')) return
    setLoading(true)
    try {
      await transactionService.deleteTransaction(id)
      toast.success('Transaksi berhasil dihapus')
      await fetchAllData()
    } catch { toast.error('Gagal menghapus transaksi') }
    finally { setLoading(false) }
  }

  if (loading && !modalOpen) return <LoadingSpinner />

  return (
    <div className="text-white pb-10 animate-fade-in">

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-2">
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 bg-gradient-to-br from-emerald-700 to-teal-900 shadow-[0_4px_16px_rgba(16,185,129,0.12)] ring-1 ring-white/[0.08]">
          <p className="text-[10px] text-emerald-100/70 uppercase tracking-widest font-medium">Total Saldo</p>
          <p className="text-[17px] font-semibold text-white leading-tight tabular-nums">Rp {formatRupiah(summary.saldo)}</p>
        </div>
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 bg-gradient-to-br from-sky-700/90 to-indigo-900 shadow-[0_4px_16px_rgba(59,130,246,0.10)] ring-1 ring-white/[0.08]">
          <p className="text-[10px] text-sky-100/70 uppercase tracking-widest font-medium">Total Pemasukan</p>
          <p className="text-[17px] font-semibold text-white leading-tight tabular-nums">Rp {formatRupiah(summary.pemasukan)}</p>
        </div>
        <div className="rounded-xl p-3 min-[901px]:p-3.5 flex flex-col gap-1.5 bg-gradient-to-br from-rose-800/80 to-slate-900 shadow-[0_4px_16px_rgba(239,68,68,0.09)] ring-1 ring-white/[0.08]">
          <p className="text-[10px] text-rose-100/70 uppercase tracking-widest font-medium">Total Pengeluaran</p>
          <p className="text-[17px] font-semibold text-white leading-tight tabular-nums">Rp {formatRupiah(summary.pengeluaran)}</p>
        </div>
      </div>

      <TableSection data={pemasukan} type="pemasukan" allTrans={allTrans}
        selectedMonth={pemasukanMonth} setMonth={setPemasukanMonth}
        page={pPage} setPage={setPPage} sortCfg={pSort} setSortCfg={setPSort}
        search={pSearch} setSearch={setPSearch} rpp={rpp} setRpp={setRpp}
        onAdd={openAddModal} onEdit={openEditModal} onDelete={handleDelete} />

      <TableSection data={pengeluaran} type="pengeluaran" allTrans={allTrans}
        selectedMonth={pengeluaranMonth} setMonth={setPengeluaranMonth}
        page={eePage} setPage={setEePage} sortCfg={eSort} setSortCfg={setESort}
        search={eSearch} setSearch={setESearch} rpp={rpp} setRpp={setRpp}
        onAdd={openAddModal} onEdit={openEditModal} onDelete={handleDelete} />

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={`${editItem ? 'Edit' : 'Tambah'} ${modalType === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Tanggal</label>
            <input type="date" value={formData.date}
              onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
              className="tq-field w-full px-3 py-2.5 text-[13px]" required />
          </div>
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-white/40">Rp</span>
              <input type="text" inputMode="numeric" value={amountDisplay}
                onChange={handleAmountChange} placeholder="0"
                className="tq-field w-full pl-8 pr-3 py-2.5 text-[13px]" required />
            </div>
          </div>
          {!editItem && wishlists.length > 0 && (
            <div>
              <label className="block text-[12px] text-white/50 mb-1.5">Hubungkan ke Wishlist <span className="text-white/25">(opsional)</span></label>
              <select value={formData.wishlistId}
                onChange={e => setFormData(p => ({ ...p, wishlistId: e.target.value }))}
                className="tq-field tq-select w-full px-3 py-2.5 text-[13px]">
                <option value="">— Pilih Wishlist —</option>
                {wishlists.map(w => (
                  <option key={w.id} value={w.id}>{w.name} (Rp {formatRupiah(w.saved_amount)} / {formatRupiah(w.target_amount)})</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Keterangan</label>
            <textarea value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              className="tq-field w-full px-3 py-2.5 text-[13px] resize-none" rows={3}
              placeholder="Contoh: Nabung buat Laptop" required />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] py-2.5 text-[13px] font-medium text-white transition hover:bg-white/[0.1]">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60 ${
                modalType === 'pemasukan' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-rose-600 to-red-700'
              }`}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  )
}