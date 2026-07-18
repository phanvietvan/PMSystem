export const getPasswordStrength = (pwd: string) => {
  if (!pwd) return { score: 0, label: '', color: 'bg-slate-200', textColor: 'text-slate-400' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 2) {
    return { score, label: 'Yếu', color: 'bg-red-500', textColor: 'text-red-500' };
  }
  if (score === 3) {
    return { score, label: 'Trung bình', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
  }
  if (score === 4) {
    return { score, label: 'Khá mạnh', color: 'bg-blue-500', textColor: 'text-blue-500' };
  }
  return { score, label: 'Rất mạnh', color: 'bg-green-500', textColor: 'text-green-500' };
};
