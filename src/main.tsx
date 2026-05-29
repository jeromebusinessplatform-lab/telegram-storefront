import { createRoot } from 'react-dom/client';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { bootstrapGeneratedSiteAnalytics } from './analytics.ts';
import App from './App.tsx';
import './index.css';
import AppErrorBoundary from './components/common/AppErrorBoundary';

try {
  bootstrapGeneratedSiteAnalytics();
} catch (error) {
  console.error('Analytics bootstrap failed:', error);
}

function routeFromDeepLink(url: string) {
  try {
    const parsed = new URL(url);
    const isPrimeCoreScheme = parsed.protocol === 'primecore:';
    const path = isPrimeCoreScheme
      ? `/${[parsed.host, parsed.pathname].filter(Boolean).join('/').replace(/\/+/g, '/')}`
      : `${parsed.pathname}${parsed.search}${parsed.hash}`;

    if (!path) return;
    window.history.replaceState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  } catch (error) {
    console.warn('Failed to handle deep link:', error);
  }
}

if (Capacitor.isNativePlatform()) {
  void CapacitorApp.getLaunchUrl().then(({ url }) => {
    if (url) routeFromDeepLink(url);
  });

  CapacitorApp.addListener('appUrlOpen', ({ url }) => {
    routeFromDeepLink(url);
  });
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
