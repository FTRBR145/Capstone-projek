import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Home'
      case '/dashboard': return 'Home'
      case '/saldo': return 'Saldo'
      case '/wishlist': return 'Wishlist'
      case '/report': return 'Report'
      case '/settings': return 'Settings'
      default: return 'TabunganQu'
    }
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full max-w-[1400px] mx-auto py-5 px-4 mb-5 bg-[#1d251f] min-[901px]:py-6 min-[901px]:px-8">
      <div className="flex items-center gap-4">
        <button 
          className="flex bg-transparent border-none text-white p-1.5 rounded min-[901px]:hidden" 
          onClick={onMenuToggle} 
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="m-0 text-white font-['Inter',_sans-serif] text-[28px] font-normal min-[901px]:text-[35px]">
          {getPageTitle()}
        </h1>
      </div>

      <div className="relative" ref={dropdownRef}>
        <div 
          className="flex items-center justify-center shrink-0 bg-[#f3f4f6] rounded-full w-[50px] h-[50px] transition-transform duration-200 hover:scale-105 cursor-pointer overflow-hidden border border-white/10" 
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <img 
            src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`) : '/default-avatar.png'} 
            alt="Avatar" 
            className="w-full h-full object-cover" 
          />
        </div>

        {dropdownOpen && (
          <div className="absolute top-[calc(100%+10px)] right-0 w-[260px] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-[slideInDown_0.2s_ease-out]">
            <div className="flex items-center gap-3 p-4">
              <div className="flex items-center justify-center shrink-0 w-12 h-12 bg-[#f3f4f6] rounded-full overflow-hidden border border-black/5">
                <img 
                  src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`) : '/default-avatar.png'} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[15px] text-black truncate">{user?.name}</div>
                <div className="text-[13px] text-[#666] truncate">{user?.email}</div>
              </div>
            </div>
            
            <div className="h-px bg-black/10" />
            
            <button 
              className="flex items-center gap-2.5 w-full py-3 px-4 bg-transparent border-none text-[14px] text-[#333] font-inherit cursor-pointer transition-colors duration-200 hover:bg-[#f0f0f0]" 
              onClick={() => { navigate('/settings'); setDropdownOpen(false) }}
            >
              <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></span> Pengaturan
            </button>
            
            <button 
              className="flex items-center gap-2.5 w-full py-3 px-4 bg-transparent border-none text-[14px] text-[#333] font-inherit cursor-pointer transition-colors duration-200 hover:bg-[#ffe5e5] hover:text-[#d32f2f]" 
              onClick={() => { logout(); navigate('/') }}
            >
              <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></span> Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  )
}