import React from 'react';
import Header from './Header';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
  title?: string;
  hideNav?: boolean;
}

export default function AppLayout({ children, showBack, title, hideNav }: AppLayoutProps) {
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
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
