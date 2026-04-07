import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'
import dashboardImg from '../images/dashboard-preview.png'

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="bg-[#1d251f] text-white font-['Inter',_sans-serif] min-h-screen overflow-x-hidden">
      <nav className="flex justify-between items-center py-5 px-5 md:py-6 md:px-16 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(255,255,255,0.1)_100%),linear-gradient(to_left,#25390f,#25390f)] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] relative z-10 animate-fade-in">
        <div className="font-['Inter',_sans-serif] text-[32px] text-white">TabunganQu</div>
        <div className="flex items-center gap-8">
          <button className="bg-transparent border-none text-white font-['Inter',_sans-serif] font-bold text-[16px] cursor-pointer" onClick={() => {}}>
            About Us
          </button>
          <button 
            className="bg-white/20 backdrop-blur-[10px] border border-white/30 rounded-lg py-2 px-8 text-white font-['Inter',_sans-serif] text-[16px] cursor-pointer transition-all duration-200 hover:bg-white/30" 
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </div>
      </nav>

      <main>
        <section className="flex flex-col items-center text-center gap-10 pt-10 pb-[80px] px-[10%] min-h-[70vh] bg-[#262d27] border-b-2 border-[#272c21] min-[993px]:flex-row min-[993px]:text-left min-[993px]:gap-0 min-[993px]:py-[80px] min-[993px]:justify-between">
          <div className="flex flex-col items-center flex-1 max-w-[600px] animate-slide-in-up min-[993px]:items-start">
            <h1 className="font-['Inter',_sans-serif] font-normal text-[32px] leading-[1.2] m-0 mb-6 md:text-[48px]">
              Kelola Tabunganmu.<br />
              Lebih Terkontrol.<br />
              Lebih Terarah.
            </h1>
            <p className="text-[16px] leading-[1.6] text-[#e2e8f0] m-0 mb-10 md:text-[18px]">
              Sistem pengelolaan tabungan yang membantu kamu mencatat setiap pemasukan dan
              pengeluaran dengan rapi, memantau progres target, dan membangun kebiasaan
              finansial yang lebih disiplin.
            </p>
            <div className="flex justify-center gap-5 min-[993px]:justify-start">
              <button 
                className="bg-[#00682c] text-white border-none py-[14px] px-7 rounded-lg text-[16px] cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,104,44,0.4)]" 
                onClick={() => navigate('/register')}
              >
                Mulai Sekarang
              </button>
              <button className="bg-[#d6d6d6] text-[#1d251f] border-none py-[14px] px-7 rounded-lg text-[16px] font-semibold cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#e2e2e2]">
                Pelajari lebih Lanjut
              </button>
            </div>
          </div>
          <div className="flex justify-center w-full flex-1 animate-fade-in [animation-delay:200ms] min-[993px]:justify-end min-[993px]:w-auto">
            <div className="flex items-center justify-center w-[400px] h-[300px] bg-gradient-to-tr from-[#10b981]/20 to-[#3b82f6]/20 border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.1)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <svg className="w-24 h-24 text-emerald-400 opacity-60 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </section>

        <section className="flex flex-col-reverse items-center text-center gap-10 py-[100px] px-[10%] bg-[#1d251f] min-[993px]:flex-row min-[993px]:text-left min-[993px]:gap-[60px]">
          <div className="flex-1 w-full animate-fade-in">
            <div className="flex items-center justify-center w-full h-[350px] bg-gradient-to-bl from-red-500/10 to-orange-500/10 border border-white/5 rounded-2xl shadow-inner relative overflow-hidden">
              <svg className="w-20 h-20 text-red-400/50 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div className="flex-1 animate-slide-in-right">
            <h2 className="font-['Inter',_sans-serif] font-normal text-[32px] leading-[1.3] m-0 mb-6 md:text-[40px]">
              Masih mencatat Tabungan Secara Manual?
            </h2>
            <p className="text-[16px] leading-[1.6] text-[#cccccc] m-0 md:text-[18px]">
              Tanpa pencatatan yang jelas, saldo sering tidak akurat, target tidak terpantau, dan uang terasa "hilang" tanpa jejak.<br/><br/>
              TabunganQu hadir sebagai solusi sederhana untuk memastikan setiap transaksi tercatat dan setiap tujuan finansial terukur.
            </p>
          </div>
        </section>

        <section className="py-[100px] px-[10%] bg-[#2f3430] animate-fade-in">
          <h2 className="font-['Inter',_sans-serif] font-normal text-[32px] leading-[1.3] m-0 mb-12 text-center md:text-[40px]">
            Dirancang Dengan Kontrol Penuh<br/>Atas Tabungan Anda
          </h2>
          
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-10 text-center">
            {[
              { id: '2.1', title: 'Pencatat Transaksi\nTerstruktur', desc: 'Catat setiap setoran dan penarikan dengan sistem yang rapi dan mudah digunakan.' },
              { id: '2.2', title: 'Dashboard Ringkasan\nReal-Time', desc: 'Lihat saldo, total setoran, dan perkembangan target dalam satu tampilan yang jelas.' },
              { id: '2.3', title: 'Target Tabungan\nyang Terukur', desc: 'Tetapkan tujuan keuangan dan pantau progresnya secara visual.' },
              { id: '2.4', title: 'Riwayat Transaksi\nTransparan', desc: 'Semua aktivitas tercatat dan dapat ditinjau kapan saja.' },
            ].map((feature) => (
              <div key={feature.id} className="flex flex-col items-center">
                <div className="flex items-center justify-center w-full h-[160px] bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-2xl shadow-sm mb-2 transition-transform hover:-translate-y-1">
                  {feature.id === '2.1' && (
                    <svg className="w-12 h-12 text-emerald-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  )}
                  {feature.id === '2.2' && (
                    <svg className="w-12 h-12 text-blue-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                  )}
                  {feature.id === '2.3' && (
                    <svg className="w-12 h-12 text-purple-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                  {feature.id === '2.4' && (
                    <svg className="w-12 h-12 text-orange-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <h3 className="font-['Inter',_sans-serif] font-normal text-[22px] leading-[1.3] m-0 mt-5 mb-3 whitespace-pre-line">
                  {feature.title}
                </h3>
                <p className="text-[16px] leading-[1.5] text-[#cccccc] m-0">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex justify-center py-[80px] px-[10%] bg-[#262d27] animate-fade-in">
          <div className="w-full max-w-[1000px]">
            <div className="w-full flex flex-col bg-[#1a1f1b] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
              <div className="h-10 w-full border-b border-white/10 bg-[#262d27] flex items-center px-4 gap-2 z-10 shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>

              <div className="w-full relative overflow-hidden bg-[#1d251f]">
                <img 
                  src={dashboardImg} 
                  alt="Preview TabunganQu Dashboard" 
                  className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.03] opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1a1f1b] to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full bg-[#3e6945]/70 shadow-lg border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-6 py-8 md:px-10 relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/20 pb-5 mb-5 gap-4">
            <div className="text-[16px] md:text-[18px] font-bold text-white">
              © 2026 TabunganQu Financial Technologies Inc.
            </div>
            <div className="flex gap-6 text-[14px] md:text-[16px] font-bold text-white">
              <a href="#" className="hover:underline text-white/80 transition-colors no-underline">Privacy Policy</a>
              <a href="#" className="hover:underline text-white/80 transition-colors no-underline">Terms of Use</a>
            </div>
          </div>

          <p className="text-[#e3e3e3] text-[14px] leading-relaxed m-0 text-justify md:text-left">
            <span className="font-bold text-white">TabunganQu</span> is an independent financial technology platform developed and operated
            independently. All third-party trademarks, logos, and brand names are
            the property of their respective owners and do not imply endorsement,
            sponsorship, or affiliation with TabunganQu unless explicitly stated.
            <br /><br />
            TabunganQu is <span className="font-bold text-white">not a bank.</span> It is a public web-based platform designed to help users manage personal finances with encrypted and secure data handling.
          </p>

        </div>
      </footer>
    </div>
  )
}