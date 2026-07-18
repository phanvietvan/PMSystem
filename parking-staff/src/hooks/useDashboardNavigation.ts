import { useState, useEffect } from 'react';

export const useDashboardNavigation = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'history'>(() => {
    return window.location.pathname === '/history' ? 'history' : 'home';
  });

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(window.location.pathname === '/history' ? 'history' : 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (tab: 'home' | 'history') => {
    setActiveTab(tab);
    window.history.pushState({}, '', tab === 'history' ? '/history' : '/');
  };

  return {
    activeTab,
    navigateTo,
  };
};
