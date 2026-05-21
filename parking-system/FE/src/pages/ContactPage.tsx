import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, AlertCircle, Cpu, Shield, Globe } from 'lucide-react';
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
    <div className="h-screen overflow-hidden bg-mesh-gradient text-on-surface font-sans selection:bg-primary/10 relative flex flex-col">
      <Navbar />

      {/* Floating Glowing Orbs */}
      <div className="absolute top-[-5%] left-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[180px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[700px] h-[700px] bg-indigo-500/10 blur-[200px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

      <main className="flex-1 min-h-0 relative pt-24 px-4 sm:px-6 lg:px-8 pb-6 flex flex-col justify-center overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full max-w-7xl mx-auto h-full min-h-0 pb-2">

          {/* Left Column: Contact Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.05 }}
            className="lg:col-span-5 flex flex-col h-full min-h-0 gap-6"
          >
            {/* Contact info list wrapper */}
            <div className="glass-panel p-6 rounded-[2rem] glow-border relative overflow-hidden bg-white/85 shadow-[0_20px_50px_rgba(0,80,203,0.06)] flex flex-col gap-5 flex-1 min-h-0">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[8px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 shadow-sm">
                  <span className="w-1.2 h-1.2 rounded-full bg-blue-600 animate-ping"></span>
                  Thông tin kết nối
                </span>
                <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight leading-none">
                  Liên hệ với chúng tôi
                </h2>
                <p className="text-slate-500/90 text-[10px] font-medium leading-relaxed mt-1.5">
                  Đội ngũ PM System luôn sẵn sàng đồng hành cùng bạn 24/7.
                </p>
              </div>

              {/* Scrollable list of cards */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 pr-1.5 pb-2 scrollbar-thin">
                {contactInfos.map((info, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4 group hover:-translate-y-0.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/60 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-all">
                      {info.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{info.title}</h3>
                      {info.action ? (
                        <a
                          href={info.action}
                          target={info.action.startsWith('http') ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className="text-sm font-black text-blue-600 hover:text-blue-700 block mt-0.5 truncate"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <span className="text-sm font-black text-blue-600 block mt-0.5 truncate">{info.value}</span>
                      )}
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal">{info.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Digital Twin Badge */}
            <div className="shrink-0 glass-panel p-5 rounded-[2rem] glow-border relative overflow-hidden bg-white/70 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100/60 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-slate-800 text-base leading-none">Bảo mật & Tin cậy</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mt-1.5">Giám sát mã hóa đầu cuối</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5 mt-1">
                <div className="flex flex-col p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1.5">
                    <Cpu size={10} className="text-emerald-500" /> Uptime
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 mt-1">99.99% SLA</span>
                </div>
                <div className="flex flex-col p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1.5">
                    <Globe size={10} className="text-emerald-500" /> Định vị
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 mt-1">Landmark 81</span>
                </div>
              </div>
            </div>

          </motion.div>

          {/* Right Column: Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.15 }}
            className="lg:col-span-7 flex flex-col h-full min-h-0"
          >
            <div className="glass-panel p-6 md:p-8 rounded-[2rem] glow-border relative overflow-hidden bg-white/85 shadow-[0_20px_50px_rgba(0,80,203,0.06)] flex flex-col h-full min-h-0">
              <div className="mb-5 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[8px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 shadow-sm">
                  <span className="w-1.2 h-1.2 rounded-full bg-blue-600 animate-ping"></span>
                  Gửi Phản Hồi
                </span>
                <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight leading-none">
                  Để lại lời nhắn
                </h2>
                <p className="text-slate-500/90 text-[10px] font-medium leading-relaxed mt-1.5">
                  Chúng tôi thường trả lời các yêu cầu trong vòng vài tiếng làm việc.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col justify-between">
                <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1.5 pb-2 scrollbar-thin">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">
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
                        className="w-full bg-white border border-outline-variant rounded-full py-2.5 px-4 text-xs font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all shadow-sm"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">
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
                        className="w-full bg-white border border-outline-variant rounded-full py-2.5 px-4 text-xs font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0901234567"
                        className="w-full bg-white border border-outline-variant rounded-full py-2.5 px-4 text-xs font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all shadow-sm"
                      />
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                      <label htmlFor="subject" className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">
                        Chủ đề liên hệ
                      </label>
                      <div className="relative">
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full bg-white border border-outline-variant rounded-full py-2.5 pl-4 pr-10 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all shadow-sm appearance-none cursor-pointer"
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
                    <label htmlFor="message" className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">
                      Nội dung tin nhắn <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Nhập nội dung bạn muốn gửi tới chúng tôi..."
                      required
                      rows={4}
                      className="w-full bg-white border border-outline-variant rounded-2xl py-3 px-4 text-xs font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all resize-none shadow-sm"
                    />
                  </div>

                  {/* Status Alerts */}
                  <AnimatePresence mode="wait">
                    {submitStatus === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-emerald-50 border border-emerald-200/60 text-emerald-800 p-3 rounded-2xl flex items-center gap-3"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[10px] font-extrabold">
                          Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất.
                        </span>
                      </motion.div>
                    )}

                    {submitStatus === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-rose-50 border border-rose-200/60 text-rose-800 p-3 rounded-2xl flex items-center gap-3"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="text-[10px] font-extrabold">
                          Vui lòng điền đầy đủ các thông tin bắt buộc (họ tên, email, nội dung).
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative overflow-hidden w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] text-xs flex items-center justify-center gap-2 mt-4 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="uppercase tracking-widest font-black text-[10px]">Đang gửi thông tin...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 relative z-10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      <span className="relative z-10 uppercase tracking-widest font-black text-[10px]">Gửi thông tin liên hệ</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

        </div>
      </main>

      <footer className="shrink-0 py-3 text-center border-t border-slate-100/60 relative z-10 bg-white/20 backdrop-blur-xs">
        <p className="text-slate-400/80 text-[10px] font-bold tracking-wide">© 2026 PM System Smart Parking Solutions. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ContactPage;
