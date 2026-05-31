import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';

function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const date = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-[12px] font-bold text-foreground font-condensed tabular-nums">{time}</span>
      <span className="text-[9px] text-muted-foreground">{date}</span>
    </div>
  );
}

export default function GlobalHeader() {
  const { isUnlocked } = useAdmin();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
      <div className="px-4 h-14 flex items-center justify-between gap-3">
        <img
          src="https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100058578/733045e7-e834-47.png"
          alt="Prime Core"
          className="h-7 w-auto object-contain flex-shrink-0"
          crossOrigin="anonymous"
        />

        <div className="flex items-center gap-2.5">
          {/* Return to Admin Panel — only visible when admin is unlocked and viewing shop */}
          {isUnlocked && !isAdminRoute && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold"
            >
              <LayoutDashboard size={11} />
              Admin Panel
            </button>
          )}

          <LiveClock />
        </div>
      </div>
    </header>
  );
}
