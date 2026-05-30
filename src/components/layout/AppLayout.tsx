import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import GlobalHeader from './GlobalHeader';

export default function AppLayout() {
  return (
    <div className="flex flex-col h-full w-full relative bg-background">
      <GlobalHeader />
      <main className="flex-1 overflow-y-auto pt-14 pb-[68px]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
