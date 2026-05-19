import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'general',
        message: '',
      });
      // Clear success notification after 5s
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    }, 1500);
  };

  const contactInfos = [
    {
      icon: <Phone className="w-5 h-5 text-blue-600" />,
      title: 'Hotline Hỗ Trợ',
      value: '1900 6868',
      desc: 'Hỗ trợ khẩn cấp & kỹ thuật 24/7',
      action: 'tel:19006868',
    },
    {
      icon: <Mail className="w-5 h-5 text-blue-600" />,
      title: 'Email Liên Hệ',
      value: 'support@PM System.vn',
      desc: 'Phản hồi trong vòng 24 giờ làm việc',
      action: 'mailto:support@PM System.vn',
    },
    {
      icon: <MapPin className="w-5 h-5 text-blue-600" />,
      title: 'Trụ Sở Chính',
      value: 'Tầng 72, Landmark 81',
      desc: '720A Điện Biên Phủ, P. 22, Q. Bình Thạnh, TP. HCM',
      action: 'https://maps.google.com',
    },
    {
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      title: 'Thời Gian Làm Việc',
      value: 'Tất cả các ngày trong tuần',
      desc: 'Hệ thống giám sát và bãi xe hoạt động 24/7/365',
    },
  ];

  return (
    <div className="min-h-screen bg-mesh-gradient text-[#191c1e] selection:bg-blue-500/10" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 relative z-10">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 px-3 py-1.5 bg-blue-50 rounded-full">Liên hệ chúng tôi</span>
            <h1 className="text-4xl md:text-5xl font-['Plus_Jakarta_Sans'] font-extrabold text-slate-900 mt-4 tracking-tight leading-tight">
              Đồng hành cùng hành trình của bạn
            </h1>
            <p className="text-slate-500 text-base md:text-lg mt-4 leading-relaxed">
              Bạn cần hỗ trợ kỹ thuật, đóng góp ý kiến hoặc muốn hợp tác? Hãy gửi tin nhắn cho chúng tôi, đội ngũ hỗ trợ sẽ phản hồi bạn ngay lập tức.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Left: Contact Info Grid */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="lg:col-span-5 space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <h2 className="text-2xl font-['Plus_Jakarta_Sans'] font-black text-slate-900">
                Thông tin liên hệ
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {contactInfos.map((info, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{info.title}</h3>
                      {info.action ? (
                        <a 
                          href={info.action} 
                          target={info.action.startsWith('http') ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className="text-base font-extrabold text-blue-600 hover:underline block mt-0.5"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <span className="text-base font-extrabold text-slate-900 block mt-0.5">{info.value}</span>
                      )}
                      <p className="text-xs text-slate-400 mt-1 leading-normal">{info.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Map Illustration */}
            <div className="bg-slate-100 border border-slate-200/50 rounded-3xl p-6 relative overflow-hidden aspect-[16/9] hidden lg:block">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="relative h-full flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Định vị bãi đỗ xe</h4>
                  <p className="text-sm font-extrabold text-slate-800 mt-1">Landmark 81 - Block A</p>
                </div>
                
                {/* Visual Landmark Badge */}
                <div className="self-end bg-white border border-slate-200 shadow-lg rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    P
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Hệ Thống Trực Tuyến</p>
                    <p className="text-xs font-bold text-slate-800">Smart Parking Building</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="lg:col-span-7"
          >
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-blue-500/5 h-full flex flex-col justify-between">
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-['Plus_Jakarta_Sans'] font-black text-slate-900">
                    Gửi tin nhắn cho chúng tôi
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Chúng tôi thường trả lời các yêu cầu trong vòng vài tiếng làm việc.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                        Địa chỉ Email <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="email" 
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="nguyenvana@gmail.com"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Phone */}
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                        Số điện thoại
                      </label>
                      <input 
                        type="tel" 
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0901234567"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                        Chủ đề liên hệ
                      </label>
                      <select 
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white transition-all appearance-none cursor-pointer"
                      >
                        <option value="general">Hỏi đáp chung / Tư vấn</option>
                        <option value="support">Báo lỗi kỹ thuật / Sự cố</option>
                        <option value="partnership">Hợp tác kinh doanh / Quảng cáo</option>
                        <option value="feedback">Góp ý nâng cấp dịch vụ</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                      Nội dung tin nhắn <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Nhập nội dung bạn muốn gửi tới chúng tôi..."
                      required
                      rows={5}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-none"
                    />
                  </div>

                  {/* Status Alerts */}
                  <AnimatePresence mode="wait">
                    {submitStatus === 'success' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold">
                          Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất.
                        </span>
                      </motion.div>
                    )}

                    {submitStatus === 'error' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3"
                      >
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="text-xs font-bold">
                          Vui lòng điền đầy đủ các thông tin bắt buộc (họ tên, email, nội dung).
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Đang gửi thông tin...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Gửi thông tin liên hệ</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>

        </div>

      </main>
    </div>
  );
};

export default ContactPage;
