import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GlobalDesignConfig } from '@/types';
import {
  DEFAULT_GLOBAL_DESIGN_CONFIG,
  GLOBAL_DESIGN_SETTING_KEY,
  applyGlobalDesignConfig,
  normalizeGlobalDesignConfig,
} from '@/lib/global-design';

type GlobalDesignContextValue = {
  config: GlobalDesignConfig;
  logoUrl: string;
};

const GlobalDesignContext = createContext<GlobalDesignContextValue>({
  config: DEFAULT_GLOBAL_DESIGN_CONFIG,
  logoUrl: DEFAULT_GLOBAL_DESIGN_CONFIG.logo_url,
});

export function GlobalDesignProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<GlobalDesignConfig>(DEFAULT_GLOBAL_DESIGN_CONFIG);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', GLOBAL_DESIGN_SETTING_KEY)
        .maybeSingle();

      if (!active) return;
      setConfig(normalizeGlobalDesignConfig(data?.value ?? DEFAULT_GLOBAL_DESIGN_CONFIG));
    };

    void load();

    const channel = supabase
      .channel('global-design-config')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: `key=eq.${GLOBAL_DESIGN_SETTING_KEY}` },
        (payload) => {
          setConfig(normalizeGlobalDesignConfig((payload.new as { value?: unknown } | null)?.value ?? DEFAULT_GLOBAL_DESIGN_CONFIG));
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyGlobalDesignConfig(config);
  }, [config]);

  const value = useMemo(
    () => ({
      config,
      logoUrl: config.logo_url || DEFAULT_GLOBAL_DESIGN_CONFIG.logo_url,
    }),
    [config],
  );

  return <GlobalDesignContext.Provider value={value}>{children}</GlobalDesignContext.Provider>;
}

export const useGlobalDesign = () => useContext(GlobalDesignContext);

