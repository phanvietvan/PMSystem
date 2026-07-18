import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { syncCurrentUserFromApi } from '../utils/auth';
import { authService } from '../services/auth.service';

export function useLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const persistAuth = (user: any, accessToken: string) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('user-login'));
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const response = await authService.googleLogin({
          idToken: tokenResponse.access_token,
        });
        const apiResponse = response.data;
        const { user, accessToken } = apiResponse.data;
        persistAuth(user, accessToken);
        setLoading(false);

        const isForceUpdate =
          !user.firstName ||
          !user.lastName ||
          user.firstName === 'Google' ||
          user.lastName === 'User';
        navigate(isForceUpdate ? '/profile' : '/');
      } catch (err: any) {
        setLoading(false);
        console.error('Google Login Error:', err.response?.data);
        setError(err.response?.data?.message || 'Đăng nhập Google thất bại.');
      }
    },
    onError: () => setError('Đăng nhập Google thất bại.'),
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authService.login({
        emailOrUsername: email,
        password,
      });
      const apiResponse = response.data;
      const { user, accessToken } = apiResponse.data;
      persistAuth(user, accessToken);
      await syncCurrentUserFromApi();
      setLoading(false);
      navigate('/profile');
    } catch (err: any) {
      setLoading(false);
      console.error('Login Error Details:', err.response?.data);
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0] ||
          'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
      );
    }
  };

  return {
    loading,
    email,
    setEmail,
    password,
    setPassword,
    error,
    loginGoogle,
    handleLogin,
  };
}
