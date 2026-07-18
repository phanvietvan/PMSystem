import { useState } from 'react';

export const useAlert = () => {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const showAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => {
      setAlertMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  return {
    alertMessage,
    setAlertMessage,
    showAlert,
  };
};
