import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Mail, MapPin, Clock, Send, CheckCircle2, AlertCircle, Shield,
  ChevronDown, MessageSquare, Globe, Zap
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';

const faqs = [
  { question: 'Làm thế nào để báo cáo sự cố khẩn cấp?', answer: 'Bạn có thể báo cáo sự cố trực tiếp qua form liên hệ hoặc gọi hotline 24/7. Đội ngũ kỹ thuật của chúng tôi sẽ xử lý ngay lập tức để không làm gián đoạn bãi đỗ.' },
  { question: 'Thời gian xử lý yêu cầu là bao lâu?', answer: 'Đối với các sự cố kỹ thuật, chúng tôi cam kết phản hồi dưới 5 phút. Các yêu cầu tư vấn thông thường sẽ được xử lý trong vòng 2 giờ làm việc.' },
  { question: 'Hệ thống có hỗ trợ nâng cấp không?', answer: 'Có, PM System liên tục được cập nhật các tính năng mới qua Cloud và cải thiện hiệu năng định kỳ mà không làm gián đoạn hoạt động.' },
  { question: 'Dữ liệu bãi xe có được bảo mật không?', answer: 'Toàn bộ dữ liệu được mã hóa chuẩn quân đội (AES-256) và sao lưu liên tục trên hệ thống máy chủ AWS an toàn tuyệt đối.' }
];

const stats = [
  { value: '99.9%', label: 'Uptime Hệ Thống' },
  { value: '< 5m', label: 'Thời Gian Phản Hồi' },
  { value: '24/7', label: 'Hỗ Trợ Kỹ Thuật' },
  { value: '10k+', label: 'Vấn Đề Đã Xử Lý' }
];

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: 'general', message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) * 0.015,
        y: (e.clientY - window.innerHeight / 2) * 0.015,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/contact', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: formData.subject === 'general' ? 'Hỏi đáp chung / Tư vấn' : formData.subject === 'support' ? 'Báo lỗi kỹ thuật / Sự cố' : formData.subject === 'partnership' ? 'Hợp tác kinh doanh' : 'Góp ý nâng cấp dịch vụ',
        message: formData.message
      });

      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: 'general', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    }
  };

  const contactInfos = [
    {
      icon: <Phone className="w-5 h-5 text-blue-600" />,
      title: 'Hotline Hỗ Trợ',
      value: '0816.386.382',
      desc: 'Hỗ trợ khẩn cấp & kỹ thuật 24/7',
      action: 'tel:0816386382',
    },
    {
      icon: <Mail className="w-5 h-5 text-indigo-600" />,
      title: 'Email Liên Hệ',
      value: 'pmsystem.system@gmail.com',
      desc: 'Phản hồi trong vòng 24 giờ làm việc',
      action: 'mailto:pmsystem.system@gmail.com',
    },
    {
      icon: <MapPin className="w-5 h-5 text-blue-600" />,
      title: 'Trụ Sở Chính',
      value: 'Sunrise Central',
      desc: '25 Nguyễn Hữu Thọ, P. Tân Hưng, TP. HCM',
      action: 'https://maps.google.com',
    },
    {
      icon: <Clock className="w-5 h-5 text-indigo-600" />,
      title: 'Thời Gian Làm Việc',
      value: 'Hoạt động 24/7',
      desc: 'Hệ thống giám sát và bãi xe hoạt động liên tục',
    },
  ];

  return (
    <div className="bg-mesh-gradient text-slate-900 antialiased min-h-screen selection:bg-blue-100 font-['Inter'] overflow-x-hidden relative flex flex-col">
      <Navbar />

      {/* Abstract Background Orbs to match Landing Page */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-indigo-100/20 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-7xl mx-auto space-y-24">
          
          {/* Header Section */}
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-100/50 shadow-[0_0_15px_rgba(96,165,250,0.15)] text-blue-600 font-semibold text-xs tracking-wide uppercase backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Hỗ trợ khách hàng 24/7
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 tracking-tight leading-tight"
            >
              Chúng tôi luôn sẵn sàng <br className="hidden md:block"/> hỗ trợ bạn
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto"
            >
              Trải nghiệm dịch vụ hỗ trợ cao cấp. Báo sự cố, nhận tư vấn giải pháp đỗ xe thông minh hoặc thảo luận hợp tác chiến lược cùng PM System.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative">
            
            {/* Left Column: Contact Cards */}
            <motion.div
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-5 space-y-6 lg:sticky lg:top-32"
            >
              {/* Contact Info List */}
              <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[28px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-shadow duration-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-full blur-[40px] -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
                
                <h2 className="text-2xl font-bold text-slate-900 mb-8 relative z-10 flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                  Thông tin liên hệ
                </h2>
                
                <div className="space-y-6 relative z-10">
                  {contactInfos.map((info, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ x: 5 }}
                      className="flex items-start gap-5 group/item cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 flex items-center justify-center shrink-0 group-hover/item:scale-110 group-hover/item:shadow-[0_0_20px_rgba(37,99,235,0.15)] transition-all duration-300">
                        {info.icon}
                      </div>
                      <div className="flex-1 pt-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">{info.title}</span>
                        {info.action ? (
                          <a
                            href={info.action}
                            target={info.action.startsWith('http') ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            className="text-base font-bold text-slate-800 hover:text-blue-600 transition-colors block"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <span className="text-base font-bold text-slate-800 block">{info.value}</span>
                        )}
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{info.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Trust Badge */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-[1px] rounded-[28px] overflow-hidden shadow-lg shadow-emerald-500/20">
                <div className="bg-white/95 backdrop-blur-xl p-6 rounded-[27px] flex items-center gap-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[20px] rounded-full"></div>
                  <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                    <Shield className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-bold text-slate-900 text-base mb-1">Bảo Mật Cấp Độ Doanh Nghiệp</h3>
                    <p className="text-slate-500 text-sm">Dữ liệu được mã hóa đầu cuối an toàn tuyệt đối 100%.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:col-span-7"
            >
              <div className="bg-white/70 backdrop-blur-xl p-8 sm:p-10 rounded-[28px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
                <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
                
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Gửi yêu cầu hỗ trợ</h2>
                    <p className="text-slate-500 text-sm">Điền thông tin bên dưới, chuyên viên của chúng tôi sẽ liên hệ lại ngay.</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <Zap className="w-3.5 h-3.5" /> Phản hồi siêu tốc
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2 relative group">
                      <label htmlFor="name" className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1 block group-focus-within:text-blue-600 transition-colors">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text" id="name" name="name"
                        value={formData.name} onChange={handleChange}
                        placeholder="VD: Nguyễn Văn A" required
                        className="w-full bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl py-3.5 px-5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 transition-all shadow-sm"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2 relative group">
                      <label htmlFor="email" className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1 block group-focus-within:text-blue-600 transition-colors">
                        Địa chỉ Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email" id="email" name="email"
                        value={formData.email} onChange={handleChange}
                        placeholder="VD: hello@congty.com" required
                        className="w-full bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl py-3.5 px-5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Phone */}
                    <div className="space-y-2 relative group">
                      <label htmlFor="phone" className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1 block group-focus-within:text-blue-600 transition-colors">
                        Số điện thoại
                      </label>
                      <input
                        type="tel" id="phone" name="phone"
                        value={formData.phone} onChange={handleChange}
                        placeholder="VD: 0901 234 567"
                        className="w-full bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl py-3.5 px-5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 transition-all shadow-sm"
                      />
                    </div>

                    {/* Subject */}
                    <div className="space-y-2 relative group">
                      <label htmlFor="subject" className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1 block group-focus-within:text-blue-600 transition-colors">
                        Chủ đề
                      </label>
                      <div className="relative">
                        <select
                          id="subject" name="subject"
                          value={formData.subject} onChange={handleChange}
                          className="w-full bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl py-3.5 pl-5 pr-12 text-sm font-medium text-slate-800 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 transition-all appearance-none shadow-sm cursor-pointer"
                        >
                          <option value="general">Hỏi đáp chung / Tư vấn</option>
                          <option value="support">Báo lỗi kỹ thuật / Sự cố</option>
                          <option value="partnership">Hợp tác kinh doanh</option>
                          <option value="feedback">Góp ý nâng cấp dịch vụ</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-slate-400">
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2 relative group">
                    <label htmlFor="message" className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1 block group-focus-within:text-blue-600 transition-colors">
                      Nội dung chi tiết <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message" name="message"
                      value={formData.message} onChange={handleChange}
                      placeholder="Mô tả chi tiết yêu cầu của bạn..." required rows={5}
                      className="w-full bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl py-4 px-5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 transition-all shadow-sm resize-none"
                    />
                  </div>

                  {/* Status Alerts */}
                  <AnimatePresence mode="wait">
                    {submitStatus === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 overflow-hidden"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-medium">
                          Tuyệt vời! Yêu cầu của bạn đã được gửi. Đội ngũ sẽ phản hồi sớm nhất.
                        </span>
                      </motion.div>
                    )}

                    {submitStatus === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="bg-rose-50/80 backdrop-blur-sm border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3 overflow-hidden"
                      >
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="text-sm font-medium">
                          Vui lòng kiểm tra lại. Hãy chắc chắn bạn đã điền đầy đủ thông tin bắt buộc.
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <button
                    type="submit" disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-[0.98] text-base flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <span>Gửi Yêu Cầu Hỗ Trợ</span>
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>

          {/* Customer Support Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
          >
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white/60 backdrop-blur-lg border border-slate-100 rounded-[28px] p-6 sm:p-8 text-center hover:bg-white/80 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight mb-2">{stat.value}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* FAQ & Map Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-24">
            {/* FAQs */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Câu hỏi thường gặp</h2>
                <p className="text-slate-500 text-lg">Tìm hiểu thêm về quy trình hỗ trợ của PM System.</p>
              </div>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div 
                    key={idx} 
                    className={`bg-white/60 backdrop-blur-lg border rounded-2xl overflow-hidden transition-all duration-300 ${activeFaq === idx ? 'border-blue-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                    >
                      <span className={`font-semibold text-base ${activeFaq === idx ? 'text-blue-600' : 'text-slate-800'}`}>
                        {faq.question}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${activeFaq === idx ? 'rotate-180 text-blue-500' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {activeFaq === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 pt-0 text-slate-500 leading-relaxed border-t border-slate-100 mt-2">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Map / Live Widget placeholder */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="h-full">
              <div className="bg-white/60 backdrop-blur-lg border border-slate-100 p-2 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[400px] lg:h-[500px] relative overflow-hidden group">
                <div className="absolute inset-2 bg-slate-100 rounded-[24px] overflow-hidden">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.8655883201416!2d106.6974758746968!3d10.744837589401768!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f9b2d26f7df%3A0x8673a55a82202611!2zMjUgTmd1eeG7hW4gSOG7r3UgVGjhu40sIFTDom4gSMawbmcsIFF14bqtbiA3LCBI4buTIENow60gTWluaCwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1716982855231!5m2!1svi!2s" 
                    width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1) opacity(0.9)' }} 
                    allowFullScreen={true} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full transition-all duration-700 group-hover:filter-none"
                  ></iframe>
                </div>
                
                {/* Floating Office Card over map */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-xl p-5 rounded-2xl border border-white shadow-xl shadow-slate-900/10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Trụ Sở PM System</h4>
                      <p className="text-sm text-slate-500 mt-1">Sẵn sàng đón tiếp khách hàng tham quan hệ thống quản lý chuẩn từ 8:00 - 17:00 các ngày trong tuần.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      <footer className="py-8 border-t border-slate-200/50 bg-white/30 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm font-medium">© 2026 PM System Smart Parking Solutions. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 bg-white/50 border border-slate-200/50 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="#" className="w-10 h-10 bg-white/50 border border-slate-200/50 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
            </a>
            <a href="#" className="w-10 h-10 bg-white/50 border border-slate-200/50 rounded-full flex items-center justify-center text-slate-400 hover:text-pink-600 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="#" className="w-10 h-10 bg-white/50 border border-slate-200/50 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-700 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
