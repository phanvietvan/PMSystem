import { useEffect, useState } from 'react';

export type ToastMessage = {
  text: string;
  type: 'success' | 'error' | 'info';
};

export function useToast(durationMs = 3000) {
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), durationMs);
    return () => clearTimeout(timer);
  }, [toastMessage, durationMs]);

  const showToast = (text: string, type: ToastMessage['type'] = 'success') => {
    setToastMessage({ text, type });
  };

  return { toastMessage, setToastMessage, showToast };
}
