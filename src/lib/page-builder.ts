import type {
  PageBuilderBlock,
  PageBuilderBlockStyle,
  PageBuilderConfig,
  PageBuilderPage,
} from '@/types';
import type { CSSProperties } from 'react';

export const PAGE_BUILDER_SETTING_KEY = 'page_builder_config';

const defaultBlockStyle = (): PageBuilderBlockStyle => ({
  font_family: 'body',
  font_style: 'normal',
  text_color: '#172033',
  accent_color: '#1687ff',
  background_color: '#ffffff',
  alignment: 'left',
  image_fit: 'cover',
  image_position_x: 50,
  image_position_y: 50,
  image_zoom: 1,
  border_radius: 24,
  remove_background: false,
});

const createId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

export const createPageBlock = (type: PageBuilderBlock['type']): PageBuilderBlock => {
  const baseStyle = defaultBlockStyle();
  const block: PageBuilderBlock = {
    id: createId(),
    type,
    enabled: true,
    title: type === 'spacer' ? '' : 'New block',
    body_markdown: type === 'spacer' ? '' : 'Edit this content in the builder.',
    image_url: '',
    image_alt: '',
    button_label: type === 'button' ? 'Learn more' : '',
    button_href: type === 'button' ? '/' : '',
    sort_order: 0,
    style: baseStyle,
  };

  if (type === 'hero') {
    block.title = 'Hero headline';
    block.body_markdown = 'Add a short supporting line here.';
    block.button_label = 'Shop now';
    block.button_href = '/';
  }

  if (type === 'image') {
    block.title = 'Image banner';
    block.body_markdown = 'Upload a banner image and adjust zoom/position.';
  }

  if (type === 'text') {
    block.title = 'Text block';
    block.body_markdown = 'You can use **bold**, *italic*, lists, and links.';
  }

  return block;
};

const normalizePage = (page: Partial<PageBuilderPage> & Pick<PageBuilderPage, 'slug' | 'label'>): PageBuilderPage => ({
  slug: page.slug,
  label: page.label,
  blocks: (page.blocks ?? []).map((block, index) => ({
    id: block.id ?? createId(),
    type: block.type ?? 'text',
    enabled: block.enabled ?? true,
    title: block.title ?? '',
    body_markdown: block.body_markdown ?? '',
    image_url: block.image_url ?? '',
    image_alt: block.image_alt ?? '',
    button_label: block.button_label ?? '',
    button_href: block.button_href ?? '',
    sort_order: block.sort_order ?? index,
    style: {
      ...defaultBlockStyle(),
      ...(block.style ?? {}),
      remove_background: block.style?.remove_background ?? false,
    },
  })),
});

export const DEFAULT_PAGE_BUILDER_CONFIG: PageBuilderConfig = {
  enabled: true,
  pages: [
    normalizePage({
      slug: 'global',
      label: 'Global',
      blocks: [
        {
          id: createId(),
          type: 'text',
          enabled: true,
          title: 'Welcome to PRIME CORE',
          body_markdown: 'Use the builder to change fonts, colors, images, and button links for the pages you want.',
          image_url: '',
          image_alt: '',
          button_label: 'Shop now',
          button_href: '/',
          sort_order: 0,
          style: {
            ...defaultBlockStyle(),
            alignment: 'center',
            accent_color: '#1687ff',
          },
        },
      ],
    }),
    normalizePage({
      slug: 'store',
      label: 'Store',
      blocks: [
        {
          id: createId(),
          type: 'hero',
          enabled: true,
          title: 'Build your storefront visually',
          body_markdown: 'Create page-specific or global sections without editing code every time.',
          image_url: '',
          image_alt: '',
          button_label: 'Start editing',
          button_href: '/admin/builder',
          sort_order: 0,
          style: {
            ...defaultBlockStyle(),
            alignment: 'left',
            background_color: '#f7fbff',
          },
        },
      ],
    }),
  ],
};

export const normalizePageBuilderConfig = (value: unknown): PageBuilderConfig => {
  const raw = value as Partial<PageBuilderConfig> | null | undefined;
  const pages = Array.isArray(raw?.pages)
    ? raw.pages
        .filter((page): page is PageBuilderPage => Boolean(page?.slug && page?.label))
        .map((page) => normalizePage(page))
    : [];

  const hasGlobal = pages.some((page) => page.slug === 'global');
  const nextPages = hasGlobal ? pages : [DEFAULT_PAGE_BUILDER_CONFIG.pages[0], ...pages];

  const normalized = nextPages.map((page) => ({
    ...page,
    blocks: page.blocks
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((block, index) => ({ ...block, sort_order: index })),
  }));

  return {
    enabled: raw?.enabled ?? true,
    pages: normalized.length > 0 ? normalized : DEFAULT_PAGE_BUILDER_CONFIG.pages,
  };
};

export const getPageBuilderPage = (config: PageBuilderConfig, slug: string) =>
  config.pages.find((page) => page.slug === slug);

export const getPageBuilderBlocksForSlug = (config: PageBuilderConfig, slug: string) => {
  const globalBlocks = getPageBuilderPage(config, 'global')?.blocks ?? [];
  const pageBlocks = slug === 'global' ? [] : getPageBuilderPage(config, slug)?.blocks ?? [];
  return [...globalBlocks, ...pageBlocks].filter((block) => block.enabled).sort((a, b) => a.sort_order - b.sort_order);
};

export const getPageBuilderSlugFromPathname = (pathname: string) => {
  if (pathname === '/' || pathname === '') return 'store';
  if (pathname.startsWith('/product/')) return 'product';
  if (pathname.startsWith('/cart')) return 'cart';
  if (pathname.startsWith('/checkout')) return 'checkout';
  if (pathname.startsWith('/orders/') ) return 'order-detail';
  if (pathname.startsWith('/orders')) return 'orders';
  if (pathname.startsWith('/profile')) return 'profile';
  if (pathname.startsWith('/support/')) return 'support-ticket';
  if (pathname.startsWith('/support')) return 'support';
  if (pathname.startsWith('/notifications')) return 'notifications';
  if (pathname.startsWith('/page/')) return pathname.split('/page/')[1] || 'custom';
  return '';
};

export const buildPageBuilderStyle = (style: PageBuilderBlockStyle): CSSProperties => ({
  color: style.text_color || undefined,
  backgroundColor: style.background_color || undefined,
  fontStyle: style.font_style === 'italic' ? 'italic' : 'normal',
  textAlign: style.alignment,
});

export const fontFamilyClass = (fontFamily: PageBuilderBlockStyle['font_family']) => ({
  body: 'font-sans',
  condensed: 'section-font',
  serif: 'font-serif',
  mono: 'font-mono',
}[fontFamily]);
