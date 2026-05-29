import { createRoot } from 'react-dom/client';
import { bootstrapGeneratedSiteAnalytics } from './analytics.ts';
import App from './App.tsx';
import './index.css';
import AppErrorBoundary from './components/common/AppErrorBoundary';

try {
  bootstrapGeneratedSiteAnalytics();
} catch (error) {
  console.error('Analytics bootstrap failed:', error);
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
