import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { useGlobalDesign } from '@/contexts/GlobalDesignContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isVerifying, error, isAdmin } = useAdmin();
  const { logoUrl } = useGlobalDesign();
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isAdmin) navigate('/admin/dashboard', { replace: true });
  }, [isAdmin, navigate]);

  const handleLogin = async () => {
    const ok = await login(code);
    if (ok) navigate('/admin/dashboard', { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-subtle p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-brand-glow">
            <img src={logoUrl} alt="Prime Core logo" className="h-10 w-10 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-foreground">PRIME CORE</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin Panel</p>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-brand-lg space-y-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-light mx-auto">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-center text-base font-bold text-foreground">Admin Access</h2>

          <div className="relative">
            <Input
              type={show ? 'text' : 'password'}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Enter access code"
              className="pr-10 font-mono text-sm"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <button
              onClick={() => setShow(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-destructive text-center font-semibold">{error}</p>
          )}

          <Button
            onClick={handleLogin}
            disabled={isVerifying || !code.trim()}
            className="w-full btn-gradient font-bold"
          >
            {isVerifying ? 'Verifying...' : 'Login'}
          </Button>

          <div className="text-center">
            <button onClick={() => navigate('/')} className="text-xs text-muted-foreground hover:text-primary">
              Back to Store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
