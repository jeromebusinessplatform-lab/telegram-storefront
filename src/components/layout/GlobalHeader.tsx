import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useStoreStatus } from '@/context/StoreStatusContext';
import type { StoreStatus } from '@/context/StoreStatusContext';
const STATUS_LABELS: Record<StoreStatus, string> = {
  open: 'STORE IS OPEN',
  closed: 'STORE IS CLOSED',
  limited: 'LIMITED OPERATION',
  maintenance: 'MAINTENANCE MODE'
};
const STATUS_COLORS: Record<StoreStatus, string> = {
  open: 'text-success',
  closed: 'text-destructive',
  limited: 'text-amber-500',
  maintenance: 'text-slate-500'
};
function pad(n: number) {
  return String(n).padStart(2, '0');
}
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
function LiveClockBlock() {
  const [now, setNow] = useState(new Date());
  const {
    status
  } = useStoreStatus();
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const mon = MONTHS[now.getMonth()];
  const dd = pad(now.getDate());
  const yyyy = now.getFullYear();
  const dateStr = `${mon} ${dd}, ${yyyy}`;
  let hours = now.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const timeStr = `${pad(hours)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${ampm}`;
  return <div className="flex flex-col items-end">
      {/* Date | Time */}
      <span className="font-condensed font-bold uppercase tabular-nums text-foreground leading-tight whitespace-nowrap" style={{
      fontSize: '11.5px',
      letterSpacing: '0.04em'
    }}>
        {dateStr}&nbsp;|&nbsp;{timeStr}
      </span>
      {/* Store status — letter-spaced to span width of line above */}
      <span className={`font-bold uppercase block leading-tight ${STATUS_COLORS[status]}`} style={{
      fontSize: '9.5px',
      fontFamily: 'Jost, sans-serif',
      letterSpacing: '0.38em'
    }}>
        {STATUS_LABELS[status]}
      </span>
    </div>;
}
export default function GlobalHeader() {
  const {
    isUnlocked
  } = useAdmin();
  const {
    pathname
  } = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = pathname.startsWith('/admin');
  return <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
      <div className="px-4 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <img src="https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100058578/733045e7-e834-47.png" alt="Prime Core" className="h-7 w-auto object-contain flex-shrink-0" crossOrigin="anonymous" />

        {/* Right side */}
        <div className="flex items-center gap-2.5">
          {/* Return to Admin Panel pill — only when admin is previewing shop */}
          {isUnlocked && !isAdminRoute && <button onClick={() => navigate('/admin')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold">
              <LayoutDashboard size={11} />
              Admin Panel
            </button>}

          {/* Live clock + store status stacked */}
          <LiveClockBlock />
        </div>
      </div>
    </header>;
}