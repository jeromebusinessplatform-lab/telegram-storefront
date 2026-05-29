import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageBuilderBlock, PageBuilderConfig } from '@/types';
import {
  DEFAULT_PAGE_BUILDER_CONFIG,
  PAGE_BUILDER_SETTING_KEY,
  buildPageBuilderStyle,
  fontFamilyClass,
  getPageBuilderBlocksForSlug,
  normalizePageBuilderConfig,
} from '@/lib/page-builder';
import { renderRichTextMarkdown } from '@/lib/rich-text';
import { cn } from '@/lib/utils';

interface PageBuilderViewportProps {
  pageSlug: string;
}

const ButtonLink = ({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className: string;
}) => {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href || '/'} className={className}>
      {children}
    </Link>
  );
};

const renderBlock = (block: PageBuilderBlock) => {
  const wrapperStyle = buildPageBuilderStyle(block.style);
  const fontClass = fontFamilyClass(block.style.font_family);

  switch (block.type) {
    case 'hero':
      return (
        <section
          key={block.id}
          className={cn('overflow-hidden rounded-2xl border shadow-brand-sm', fontClass)}
          style={wrapperStyle}
        >
          {block.image_url && (
            <div className="relative h-40 sm:h-52 overflow-hidden">
              <img
                src={block.image_url}
                alt={block.image_alt || block.title || 'Page builder hero'}
                className="absolute inset-0 h-full w-full"
                style={{
                  objectFit: block.style.image_fit,
                  objectPosition: `${block.style.image_position_x}% ${block.style.image_position_y}%`,
                  transform: `scale(${block.style.image_zoom})`,
                }}
                onError={(event) => {
                  (event.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="p-4 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Builder Block</p>
            {block.title && <h2 className="mt-1 text-base font-black leading-tight">{block.title}</h2>}
            {block.body_markdown && (
              <div
                className="mt-2 text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: renderRichTextMarkdown(block.body_markdown) }}
              />
            )}
            {block.button_label && (
              <ButtonLink
                href={block.button_href}
                className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                {block.button_label}
              </ButtonLink>
            )}
          </div>
        </section>
      );
    case 'image':
      return (
        <section key={block.id} className={cn('overflow-hidden rounded-2xl border shadow-brand-sm', fontClass)} style={wrapperStyle}>
          {block.image_url ? (
            <div className="relative h-48 overflow-hidden">
              <img
                src={block.image_url}
                alt={block.image_alt || block.title || 'Page builder image'}
                className="absolute inset-0 h-full w-full"
                style={{
                  objectFit: block.style.image_fit,
                  objectPosition: `${block.style.image_position_x}% ${block.style.image_position_y}%`,
                  transform: `scale(${block.style.image_zoom})`,
                }}
                onError={(event) => {
                  (event.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center bg-muted text-sm text-muted-foreground">
              No image selected
            </div>
          )}
          {(block.title || block.body_markdown) && (
            <div className="p-4">
              {block.title && <p className="text-sm font-black">{block.title}</p>}
              {block.body_markdown && (
                <div className="mt-1 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderRichTextMarkdown(block.body_markdown) }} />
              )}
            </div>
          )}
        </section>
      );
    case 'button':
      return (
        <section key={block.id} className={cn('rounded-2xl border p-4 shadow-brand-sm', fontClass)} style={wrapperStyle}>
          {block.title && <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{block.title}</p>}
          <ButtonLink href={block.button_href} className="mt-2 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
            {block.button_label || 'Button'}
          </ButtonLink>
        </section>
      );
    case 'spacer':
      return <div key={block.id} className="h-6 sm:h-8" aria-hidden="true" />;
    case 'text':
    default:
      return (
        <section
          key={block.id}
          className={cn('rounded-2xl border p-4 shadow-brand-sm', fontClass)}
          style={wrapperStyle}
        >
          {block.title && <h2 className="text-base font-black leading-tight">{block.title}</h2>}
          {block.body_markdown && (
            <div
              className="mt-2 text-sm"
              dangerouslySetInnerHTML={{ __html: renderRichTextMarkdown(block.body_markdown) }}
            />
          )}
          {block.button_label && (
            <ButtonLink
              href={block.button_href}
              className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              {block.button_label}
            </ButtonLink>
          )}
        </section>
      );
  }
};

export default function PageBuilderViewport({ pageSlug }: PageBuilderViewportProps) {
  const [config, setConfig] = useState<PageBuilderConfig>(DEFAULT_PAGE_BUILDER_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', PAGE_BUILDER_SETTING_KEY).maybeSingle();
      const next = normalizePageBuilderConfig(data?.value ?? DEFAULT_PAGE_BUILDER_CONFIG);
      setConfig(next);
      setIsLoading(false);
    };
    void load();
  }, []);

  const blocks = useMemo(() => {
    if (!config.enabled) return [];
    return getPageBuilderBlocksForSlug(config, pageSlug);
  }, [config, pageSlug]);

  if (isLoading || blocks.length === 0) return null;

  return (
    <section className="px-4 pt-4">
      <div className="space-y-3">
        {blocks.map((block) => renderBlock(block))}
      </div>
    </section>
  );
}
