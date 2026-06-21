import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';

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
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'general',
        message: '',
      });
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitStatus('error');
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    }
  };

  const contactInfos = [
    {
      icon: <Phone className="w-4 h-4 text-blue-500" />,
      title: 'Hotline Hỗ Trợ',
      value: '0816386382',
      desc: 'Hỗ trợ khẩn cấp & kỹ thuật 24/7',
      action: 'tel:0816386382',
    },
    {
      icon: <Mail className="w-4 h-4 text-blue-500" />,
      title: 'Email Liên Hệ',
      value: 'pmsystem.system' + '@' + 'gmail.com',
      desc: 'Phản hồi trong vòng 24 giờ làm việc',
      action: 'mailto:pmsystem.system' + '@' + 'gmail.com',
    },
    {
      icon: <MapPin className="w-4 h-4 text-blue-500" />,
      title: 'Trụ Sở Chính',
      value: 'Sunrise Central',
      desc: '25 Nguyễn Hữu Thọ, P. Tân Hưng,TP. HCM',
      action: 'https://maps.google.com',
    },
    {
      icon: <Clock className="w-4 h-4 text-blue-500" />,
      title: 'Thời Gian Làm Việc',
      value: 'Hoạt động 24/7',
      desc: 'Hệ thống giám sát và bãi xe hoạt động liên tục',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans relative flex flex-col">
      <Navbar />

      {/* Floating Glowing Orbs for a premium ambient effect */}
      <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-blue-400/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-[-10%] w-[600px] h-[600px] bg-indigo-400/10 blur-[180px] rounded-full pointer-events-none"></div>

      <main className="flex-grow pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative z-10 flex items-center justify-center">
        <div className="w-full max-w-6xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base font-medium">
              Gặp sự cố, có câu hỏi hay muốn hợp tác? Hãy gửi thông tin cho đội ngũ PM System, chúng tôi sẽ phản hồi trong thời gian sớm nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Contact Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-5 space-y-6"
            >
              {/* Contact Info List */}
              <div className="bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Thông tin liên hệ</h2>
                <div className="space-y-4">
                  {contactInfos.map((info, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50/50 hover:bg-white border border-slate-100/80 rounded-2xl p-4 transition-all duration-300 flex items-start gap-4 group hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                        {info.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{info.title}</span>
                        {info.action ? (
                          <a
                            href={info.action}
                            target={info.action.startsWith('http') ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-blue-600 hover:text-blue-700 block mt-0.5 transition-colors truncate"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <span className="text-sm font-bold text-slate-800 block mt-0.5 truncate">{info.value}</span>
                        )}
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{info.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Badge */}
              <div className="bg-white/85 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100/60 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-snug">Hệ thống Giám sát Bảo mật</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Dữ liệu bãi đỗ và thông tin tài khoản được mã hóa bảo mật toàn vẹn.</p>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-7"
            >
              <div className="bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Gửi tin nhắn phản hồi</h2>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-xs font-bold text-slate-500 ml-1">
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
                        className="w-full bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl py-3 px-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-xs font-bold text-slate-500 ml-1">
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
                        className="w-full bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl py-3 px-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-xs font-bold text-slate-500 ml-1">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0901234567"
                        className="w-full bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl py-3 px-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                      <label htmlFor="subject" className="text-xs font-bold text-slate-500 ml-1">
                        Chủ đề liên hệ
                      </label>
                      <div className="relative">
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl py-3 pl-4 pr-10 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                        >
                          <option value="general">Hỏi đáp chung / Tư vấn</option>
                          <option value="support">Báo lỗi kỹ thuật / Sự cố</option>
                          <option value="partnership">Hợp tác kinh doanh</option>
                          <option value="feedback">Góp ý nâng cấp dịch vụ</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                          <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-xs font-bold text-slate-500 ml-1">
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
                      className="w-full bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl py-3 px-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                    />
                  </div>

                  {/* Status Alerts */}
                  <AnimatePresence mode="wait">
                    {submitStatus === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-semibold">
                          Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất.
                        </span>
                      </motion.div>
                    )}

                    {submitStatus === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3"
                      >
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="text-xs font-semibold">
                          Vui lòng điền đầy đủ các thông tin bắt buộc (họ tên, email, nội dung).
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl transition-all duration-150 shadow-md hover:shadow-lg active:scale-[0.99] text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
            </motion.div>

          </div>
        </div>
      </main>

      <footer className="py-6 text-center border-t border-slate-200/60 bg-white/40 backdrop-blur-xs relative z-10">
        <p className="text-slate-400 text-xs font-medium">© 2026 PM System Smart Parking Solutions. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ContactPage;
