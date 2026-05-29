import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { PAGE_BUILDER_SETTING_KEY, getPageBuilderPage, normalizePageBuilderConfig } from '@/lib/page-builder';
import { DEFAULT_PAGE_BUILDER_CONFIG } from '@/lib/page-builder';

export default function BuilderPage() {
  const { slug = 'custom' } = useParams();
  const [title, setTitle] = useState('Custom Page');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', PAGE_BUILDER_SETTING_KEY).maybeSingle();
      const config = normalizePageBuilderConfig(data?.value ?? DEFAULT_PAGE_BUILDER_CONFIG);
      const page = getPageBuilderPage(config, slug);
      setTitle(page?.label ?? 'Custom Page');
    };
    void load();
  }, [slug]);

  return (
    <AppLayout showBack title={title}>
      <div className="px-4 py-4">
        <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
          This page is managed from the Page Builder.
        </div>
      </div>
    </AppLayout>
  );
}
