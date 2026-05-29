import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import PageBuilderViewport from '@/components/page-builder/PageBuilderViewport';
import { getPageBuilderSlugFromPathname } from '@/lib/page-builder';

interface AppLayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
  title?: string;
  hideNav?: boolean;
}

export default function AppLayout({ children, showBack, title, hideNav }: AppLayoutProps) {
  const location = useLocation();
  const pageSlug = getPageBuilderSlugFromPathname(location.pathname);

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      <Header showBack={showBack} title={title} />
      <main
        className="absolute left-0 right-0 overflow-y-auto"
        style={{
          top: 'var(--header-height)',
          bottom: hideNav ? 0 : 'var(--bottom-nav-height)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {pageSlug && <PageBuilderViewport pageSlug={pageSlug} />}
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
