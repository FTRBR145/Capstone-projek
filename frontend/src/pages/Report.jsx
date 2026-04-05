import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Footer from '../components/layout/Footer'
import api from '../services/api'

export default function Report() {
  const { user } = useAuth()
  const toast = useToast()
  
  const [reportText, setReportText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!reportText.trim()) {
      toast.error('Laporan tidak boleh kosong!')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Kirim feedback ke backend (kita perlu buat endpoint ini nanti)
    
      
      toast.success('Laporan berhasil dikirim! Terima kasih atas masukanmu.')
      setReportText('')
    } catch (error) {
      toast.error('Gagal mengirim laporan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="text-white pb-10 animate-fade-in font-['Inter',_sans-serif]">
      {/* Main Panel Report */}
      <div className="bg-[#555555] bg-[linear-gradient(260deg,rgba(0,0,0,0.2)_60%,rgba(153,153,153,0.2)_100%)] rounded-[18px] p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/5 w-full max-w-[900px]">
        
        <h3 className="text-[28px] md:text-[32px] font-normal text-white m-0 mb-1">
          Hi, {user?.name || 'user'}
        </h3>
        
        <p className="text-[15px] text-white/80 mb-6 font-normal">
          Apa yang mau kamu laporkan?
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Textarea Panel */}
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Web nya bagus..."
            className="w-full h-[160px] bg-[#919191]/80 rounded-[16px] p-5 text-[15px] text-white placeholder:text-white/60 outline-none border border-transparent focus:border-white/30 transition-colors resize-none shadow-inner font-['Inter',_sans-serif]"
            required
            disabled={isSubmitting}
          ></textarea>

          {/* Submit Button */}
          <div className="flex justify-end mt-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-[linear-gradient(86.41deg,#f44336_2.88%,#8e271f_100%)] rounded-full py-2 px-8 text-white font-['Inter',_sans-serif] text-[15px] font-medium border-none shadow-lg transition-all duration-200 ${
                isSubmitting 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:opacity-90 hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim'}
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  )
}