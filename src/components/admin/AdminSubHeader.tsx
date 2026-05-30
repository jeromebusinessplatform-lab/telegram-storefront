import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  subtitle?: string;
  backTo?: string;
}

export default function AdminSubHeader({ title, subtitle, backTo = '/admin' }: Props) {
  const navigate = useNavigate();
  return (
    <div className="bg-hero-gradient px-5 pt-5 pb-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(backTo)} className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <ArrowLeft size={16} className="text-primary-foreground" />
        </button>
        <div>
          <p className="text-primary-foreground/60 text-[10px] font-medium uppercase tracking-wide">Admin Panel</p>
          <h1 className="text-primary-foreground font-bold text-base font-condensed leading-tight">{title}</h1>
          {subtitle && <p className="text-primary-foreground/70 text-[10px] mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
