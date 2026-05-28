import { useEffect, useState } from 'react';
import { AnnouncementConfig } from '@/types';
import { renderRichTextMarkdown } from '@/lib/rich-text';
import { Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnnouncementBannerProps {
  announcement: AnnouncementConfig;
}

export default function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const shouldShowImage = Boolean(announcement.banner_image_url) && announcement.display_mode !== 'text';
  const shouldShowText = Boolean(announcement.title.trim() || announcement.body_markdown.trim()) && announcement.display_mode !== 'image';
  const publishAt = announcement.publish_at ? new Date(announcement.publish_at).getTime() : null;
  const takedownAt = announcement.takedown_at ? new Date(announcement.takedown_at).getTime() : null;
  const scheduledVisible = (
    (!announcement.auto_publish || !publishAt || now >= publishAt) &&
    (!announcement.auto_takedown || !takedownAt || now <= takedownAt)
  );
  const manualVisible = Boolean(announcement.enabled);
  const isVisible = (manualVisible || Boolean(announcement.auto_publish)) && scheduledVisible;

  if (!isVisible) return null;

  const fontClass = {
    nunito: 'font-sans',
    noto: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
  }[announcement.font_family ?? 'nunito'];
  const styleClass = {
    clean: 'border-primary/15 bg-card',
    soft: 'border-primary/10 bg-primary-light',
    bold: 'border-primary bg-primary text-primary-foreground',
    outlined: 'border-primary bg-background',
  }[announcement.visual_style ?? 'clean'];
  const textStyle = {
    color: announcement.text_color || undefined,
    fontStyle: announcement.font_style === 'italic' ? 'italic' : 'normal',
  };
  const accentStyle = {
    color: announcement.accent_color || undefined,
  };

  if (!shouldShowImage && !shouldShowText) return null;

  return (
    <div className="px-3 pt-3">
      <div className={cn('overflow-hidden rounded-2xl border shadow-brand-sm', fontClass, styleClass)}>
        {shouldShowImage && (
          <div className="relative">
            <img
              src={announcement.banner_image_url}
              alt={announcement.banner_alt || announcement.title || 'Announcement banner'}
              className="h-40 w-full object-cover sm:h-48"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
            {announcement.title && (
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">
                  <Megaphone className="h-3.5 w-3.5" />
                  Announcement
                </div>
                <h2 className="mt-1 text-lg font-black leading-tight">{announcement.title}</h2>
              </div>
            )}
          </div>
        )}

        {shouldShowText && (
          <div className="p-4" style={textStyle}>
            {!shouldShowImage && (
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary" style={accentStyle}>
                <Megaphone className="h-3.5 w-3.5" />
                Announcement
              </div>
            )}
            {announcement.title && !shouldShowImage && (
              <h2 className="mt-1 text-base font-black leading-tight">{announcement.title}</h2>
            )}
            {announcement.body_markdown && (
              <div
                className="announcement-copy"
                dangerouslySetInnerHTML={{ __html: renderRichTextMarkdown(announcement.body_markdown) }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
