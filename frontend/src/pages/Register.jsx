import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import ReCAPTCHA from 'react-google-recaptcha'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showGooglePasswordModal, setShowGooglePasswordModal] = useState(false)
  const [googlePassword, setGooglePassword] = useState('')
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState(null)
  
  const googleBtnRef = useRef(null)
  const recaptchaRef = useRef(null)
  
  const { register, googleLogin } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!name || !email || !password) {
      toast.error('Semua field harus diisi')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Format email tidak valid')
      return
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    if (!captchaToken) {
      toast.error('Tolong selesaikan verifikasi reCAPTCHA terlebih dahulu')
      return
    }

    setIsLoading(true)
    
    try {
      const result = await register(name, email, password, captchaToken)
      
      if (result.success) {
        toast.success('Akun berhasil dibuat! 🎉')
        navigate('/dashboard', { replace: true })
      } else {
        toast.error(result.message)
        recaptchaRef.current?.reset()
        setCaptchaToken(null)
      }
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setPendingGoogleAuth(credentialResponse)
    setShowGooglePasswordModal(true)
  }

  const handleGooglePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (!googlePassword) {
      toast.error('Password harus diisi')
      return
    }

    if (googlePassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setIsGoogleLoading(true)
    try {
      const result = await googleLogin(pendingGoogleAuth, googlePassword, captchaToken, 'register')
      if (result.success) {
        toast.success('Berhasil masuk dengan Google! 🎉')
        setShowGooglePasswordModal(false)
        setGooglePassword('')
        setPendingGoogleAuth(null)
        setTimeout(() => navigate('/dashboard', { replace: true }), 500)
      } else {
        toast.error(result.message)
        recaptchaRef.current?.reset()
        setCaptchaToken(null)
        setShowGooglePasswordModal(false)
        setGooglePassword('')
        setPendingGoogleAuth(null)
      }
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const triggerGoogleLogin = () => {
    if (!captchaToken) {
      toast.error('Tolong selesaikan verifikasi reCAPTCHA terlebih dahulu')
      return
    }
    googleBtnRef.current?.querySelector('div[role=button]')?.click()
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#101010] overflow-hidden font-['Inter',_sans-serif]">
      
      <div className="absolute inset-0 bg-[#1a221f] flex items-center justify-center z-[1]">
        <div className="text-white/20 text-[24px] border-2 border-dashed border-white/20 py-5 px-10 rounded-xl">
          Background Image Placeholder (image-bg0.png)
        </div>
      </div>
      
      <div className="absolute inset-0 z-[2] backdrop-blur-[2px] bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(140,255,0,0.1)_100%),linear-gradient(to_left,rgba(16,16,16,0.8),rgba(16,16,16,0.8))]"></div>
      <div className="absolute inset-0 z-[3] bg-[radial-gradient(closest-side,rgba(255,255,255,0.1)_10%,rgba(255,255,255,0)_100%)]"></div>
      
      <div className="relative z-10 w-full max-w-[90%] min-[577px]:max-w-[420px] bg-[#525050]/60 rounded-2xl py-[30px] px-6 min-[577px]:py-10 min-[577px]:px-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-[10px] border border-white/10 animate-scale-in">
        
        <button 
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          title="Kembali ke Beranda"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h1 
          className="font-bold text-[40px] min-[577px]:text-[48px] text-white text-center m-0 mb-2.5 leading-none cursor-pointer hover:text-emerald-400 transition-colors font-['Inter',_sans-serif]" 
          onClick={() => navigate('/')}
        >
          TabunganQu
        </h1>

        <p className="text-white text-[13px] text-left mb-[30px] opacity-90">
          Mulai perjalanan menuju finansial teratur.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Nama lengkap"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-transparent border-none text-white text-[16px] py-2 outline-none placeholder:text-white/50"
            />
            <div className="h-px bg-white/60 w-full mt-1"></div>
          </div>

          <div className="relative w-full mt-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-transparent border-none text-white text-[16px] py-2 outline-none placeholder:text-white/50"
            />
            <div className="h-px bg-white/60 w-full mt-1"></div>
          </div>
          
          <div className="relative w-full mt-4">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-transparent border-none text-white text-[16px] py-2 pr-10 outline-none placeholder:text-white/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-2 text-white/50 hover:text-white transition-colors"
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
            <div className="h-px bg-white/60 w-full mt-1"></div>
          </div>

          <div className="mt-6 flex justify-start">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-4 bg-[#28a745] text-white border-none p-3 text-[16px] font-medium rounded cursor-pointer transition-colors duration-200 hover:bg-[#218838] disabled:opacity-50 disabled:cursor-not-allowed font-['Inter',_sans-serif]"
          >
            {isLoading ? 'Loading...' : 'Daftar'}
          </button>
        </form>

        <div className="relative mt-4">
          <div ref={googleBtnRef} className="absolute opacity-0 pointer-events-none w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Login dengan Google gagal. Silakan coba lagi.')}
              width="100%"
            />
          </div>
          <button
            type="button"
            className="w-full bg-[#e0e0e0] text-[#333] border-none p-3 text-[16px] font-medium rounded cursor-pointer flex items-center justify-center gap-2.5 transition-colors duration-200 hover:bg-[#d0d0d0] font-['Inter',_sans-serif] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={triggerGoogleLogin}
            disabled={isGoogleLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isGoogleLoading ? 'Loading...' : 'Google'}
          </button>
        </div>

        <div className="flex justify-between items-center mt-8 text-white text-[14px] font-['Inter',_sans-serif]">
          <Link to="/login" className="text-[#00b2ff] no-underline hover:underline">
            Sudah punya akun? Login
          </Link>
          
          <Link to="/" className="text-white/60 hover:text-white transition-colors flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Beranda</span>
          </Link>
        </div>
      </div>

      {/* Google Password Modal */}
      {showGooglePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 p-4 font-['Inter',_sans-serif]">
          <div className="bg-[#1f2926] border border-white/10 p-8 rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-2">Pilih Password Baru</h3>
            <p className="text-white/70 text-sm mb-6">
              Untuk mengamankan akun TabunganQu Anda, silakan buat password. 
              Password ini tidak akan mengubah password Google Anda.
            </p>
            <form onSubmit={handleGooglePasswordSubmit}>
              <div className="relative w-full mb-6">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan Password"
                  value={googlePassword}
                  onChange={(e) => setGooglePassword(e.target.value)}
                  className="w-full bg-transparent border-b border-white/30 text-white text-[16px] py-2 pr-10 outline-none focus:border-emerald-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-2 text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowGooglePasswordModal(false)
                    setGooglePassword('')
                    setPendingGoogleAuth(null)
                  }}
                  className="px-4 py-2 rounded font-medium text-white/70 hover:bg-white/10 transition-colors"
                  disabled={isGoogleLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isGoogleLoading}
                  className="bg-[#28a745] hover:bg-[#218838] text-white px-5 py-2 rounded font-medium transition-colors disabled:opacity-50"
                >
                  {isGoogleLoading ? 'Menyimpan...' : 'Lanjutkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}