import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import Footer from '../components/layout/Footer'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const Icon = ({ name, size = 16, className = '' }) => {
  // ... (same Icon component code)
}

export default function Settings() {
  const { user, updateProfile: authUpdateProfile, uploadAvatar, deleteAvatar, deleteAccount: authDeleteAccount, logout } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef(null)

  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState({
    profile: false,
    password: false,
    delete: false,
    avatar: false
  })

  const handleDeleteAccount = async () => {
    setLoading(prev => ({ ...prev, delete: true }))
    
    try {
      const result = await authDeleteAccount()
      if (result.success) {
        toast.success('Akun Anda telah dihapus secara permanen 🗑️')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Gagal menghapus akun')
    } finally {
      setLoading(prev => ({ ...prev, delete: false }))
      setShowDeleteConfirm(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB')
      return
    }

    const formData = new FormData()
    formData.append('avatar', file)

    setLoading(prev => ({ ...prev, avatar: true }))
    try {
      const result = await uploadAvatar(formData)
      if (result.success) {
        toast.success('Foto profil berhasil diperbarui 📸')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Gagal upload foto profil')
    } finally {
      setLoading(prev => ({ ...prev, avatar: false }))
    }
  }

  const handleDeleteAvatar = async () => {
    setLoading(prev => ({ ...prev, avatar: true }))
    try {
      const result = await deleteAvatar()
      if (result.success) {
        toast.success('Foto profil berhasil dihapus 🗑️')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Gagal hapus foto profil')
    } finally {
      setLoading(prev => ({ ...prev, avatar: false }))
    }
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    
    if (!name.trim()) { 
      toast.error('Nama tidak boleh kosong'); 
      return 
    }

    setLoading(prev => ({ ...prev, profile: true }))
    
    try {
      const result = await authUpdateProfile({ name: name.trim() })
      if (result.success) {
        toast.success('Profil berhasil diperbarui ✅')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Gagal update profil')
    } finally {
      setLoading(prev => ({ ...prev, profile: false }))
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (!oldPw || !newPw) { 
      toast.error('Semua field password harus diisi'); 
      return 
    }
    if (newPw.length < 6) { 
      toast.error('Password baru minimal 6 karakter'); 
      return 
    }

    setLoading(prev => ({ ...prev, password: true }))
    
    try {
      await api.put('/auth/password', { oldPassword: oldPw, newPassword: newPw })
      toast.success('Password berhasil diubah 🔐')
      setOldPw('')
      setNewPw('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengubah password')
    } finally {
      setLoading(prev => ({ ...prev, password: false }))
    }
  }

  return (
    <div className="text-white pb-10 animate-fade-in font-['Inter',_sans-serif]">
      <h2 className="text-[24px] font-normal mb-10">Profile Anda</h2>

      <div className="flex flex-col items-center mb-10">
        <div 
          className="relative group cursor-pointer mb-4" 
          onClick={() => !loading.avatar && fileInputRef.current?.click()}
        >
          <div className="w-[100px] h-[100px] bg-[#e5e7eb] rounded-full flex items-center justify-center shadow-[0_0_0_6px_rgba(255,255,255,0.1)] overflow-hidden">
            {user?.avatar ? (
              <img 
                src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full bg-[#f3f4f6]">
                <circle cx="50" cy="35" r="22" fill="#9ca3af" />
                <path d="M15 95 C 15 65, 85 65, 85 95" fill="#9ca3af" />
              </svg>
            )}
          </div>
          
          <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
            {loading.avatar ? (
              <span className="text-white text-[12px] font-medium">Loading...</span>
            ) : (
              <>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2" className="mb-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 0 1 2-2h3.5l1.5-2h4l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span className="text-[10px] text-white font-medium">Ubah Foto</span>
              </>
            )}
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleAvatarChange} 
          accept="image/*" 
          className="hidden" 
        />
        <h3 className="text-[32px] font-normal text-white text-center m-0 mb-2">
          {user?.name || 'Nama Pengguna'}
        </h3>
        {user?.avatar && (
          <button 
            type="button"
            onClick={handleDeleteAvatar}
            disabled={loading.avatar}
            className="bg-transparent border border-[#ff6b6b] text-[#ff6b6b] rounded-full py-1.5 px-4 text-[12px] cursor-pointer transition-colors hover:bg-[#ff6b6b] hover:text-white"
          >
            Hapus Foto Profil
          </button>
        )}
      </div>

      <div className="max-w-[700px] mx-auto flex flex-col gap-8">
        
        <div className="bg-[#555555] bg-[linear-gradient(260deg,rgba(0,0,0,0.2)_60%,rgba(153,153,153,0.2)_100%)] rounded-[18px] p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/5">
          <form onSubmit={handleProfileSave} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-white font-normal text-[14px]">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="bg-[#666666] border-none rounded-lg py-3.5 px-4 text-white font-['Inter',_sans-serif] text-[15px] outline-none focus:ring-1 focus:ring-white/30 transition-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-white font-normal text-[14px]">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full bg-[#666666]/50 border-none rounded-lg py-3.5 pl-4 pr-10 text-white/50 font-['Inter',_sans-serif] text-[15px] outline-none cursor-not-allowed"
                />
                <Icon name="lock" size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button 
                type="submit" 
                disabled={loading.profile}
                className={`bg-[#5bc55f] text-white border-none rounded-[20px] py-2 px-8 font-['Inter',_sans-serif] text-[14px] cursor-pointer transition-opacity duration-200 hover:opacity-90 ${
                  loading.profile ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading.profile ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-[#555555] bg-[linear-gradient(260deg,rgba(0,0,0,0.2)_60%,rgba(153,153,153,0.2)_100%)] rounded-[18px] p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/5">
          <h4 className="text-[18px] font-medium text-white mb-6 m-0 flex items-center gap-2">
            <Icon name="lock" size={18} /> Keamanan
          </h4>
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-white font-normal text-[14px]">Password Lama</label>
              <input
                type="password"
                value={oldPw}
                onChange={e => setOldPw(e.target.value)}
                placeholder="Masukkan password lama"
                required
                className="bg-[#666666] border-none rounded-lg py-3.5 px-4 text-white font-['Inter',_sans-serif] text-[15px] outline-none focus:ring-1 focus:ring-white/30 transition-all placeholder:text-white/40"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-white font-normal text-[14px]">Password Baru</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                className="bg-[#666666] border-none rounded-lg py-3.5 px-4 text-white font-['Inter',_sans-serif] text-[15px] outline-none focus:ring-1 focus:ring-white/30 transition-all placeholder:text-white/40"
              />
            </div>
            <div className="flex justify-end mt-2">
              <button 
                type="submit" 
                disabled={loading.password}
                className={`bg-white/10 border border-white/20 text-white rounded-[20px] py-2 px-6 font-['Inter',_sans-serif] text-[14px] cursor-pointer transition-colors duration-200 hover:bg-white/20 ${
                  loading.password ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading.password ? 'Mengubah...' : 'Ubah Password'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-[#3a1c1c] bg-[linear-gradient(260deg,rgba(0,0,0,0.2)_60%,rgba(200,50,50,0.1)_100%)] rounded-[18px] p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-red-500/20">
          <h4 className="text-[18px] font-medium text-[#ff6b6b] mb-3 m-0 flex items-center gap-2">
            <Icon name="warning" size={18} /> Zona Berbahaya
          </h4>
          <p className="text-[14px] text-white/70 leading-relaxed mb-6">
            Sekali Anda menghapus akun, semua data riwayat transaksi dan wishlist akan hilang secara permanen dan tidak dapat dikembalikan.
          </p>

          {!showDeleteConfirm ? (
            <button 
              className="bg-transparent border border-[#ff6b6b] text-[#ff6b6b] rounded-lg py-3 px-6 font-['Inter',_sans-serif] text-[14px] font-medium cursor-pointer transition-colors duration-200 hover:bg-[#ff6b6b] hover:text-white flex items-center gap-2"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading.delete}
            >
              <Icon name="trash" size={16} /> Hapus Akun Saya
            </button>
          ) : (
            <div className="bg-black/30 border border-red-500/30 rounded-xl p-5 animate-scale-in">
              <p className="text-white font-medium text-[15px] mb-4 m-0">
                Apakah Anda yakin ingin menghapus akun permanen?
              </p>
              <div className="flex gap-3">
                <button 
                  className="bg-white/10 border-none text-white rounded-lg py-2.5 px-5 font-['Inter',_sans-serif] text-[13px] cursor-pointer transition-colors hover:bg-white/20"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading.delete}
                >
                  Batal
                </button>
                <button 
                  className={`bg-[#ff4747] border-none text-white rounded-lg py-2.5 px-5 font-['Inter',_sans-serif] text-[13px] font-medium cursor-pointer transition-colors hover:bg-[#ff2424] ${
                    loading.delete ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={handleDeleteAccount}
                  disabled={loading.delete}
                >
                  {loading.delete ? 'Menghapus...' : 'Ya, Hapus Permanen!'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}