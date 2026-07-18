import { useState } from 'react';
import { parkingService } from '../services/parking.service';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  subject: 'general',
  message: '',
};

export function useContactForm() {
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
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
    setSubmitError('');

    try {
      await parkingService.sendContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject:
          formData.subject === 'general'
            ? 'Hỏi đáp chung / Tư vấn'
            : formData.subject === 'support'
              ? 'Báo lỗi kỹ thuật / Sự cố'
              : formData.subject === 'partnership'
                ? 'Hợp tác kinh doanh'
                : 'Góp ý nâng cấp dịch vụ',
        message: formData.message,
      });

      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData(emptyForm);
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitStatus('error');
      const apiMsg = err?.response?.data?.error || err?.response?.data?.message;
      setSubmitError(
        apiMsg
          ? String(apiMsg)
          : 'Gửi thất bại. Kiểm tra lại form hoặc kết nối máy chủ (SMTP).',
      );
      setTimeout(() => {
        setSubmitStatus('idle');
        setSubmitError('');
      }, 8000);
    }
  };

  return {
    formData,
    isSubmitting,
    submitStatus,
    submitError,
    handleChange,
    handleSubmit,
  };
}
