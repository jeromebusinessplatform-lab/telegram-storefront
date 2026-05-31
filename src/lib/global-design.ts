import type { GlobalDesignConfig } from '@/types';

export const GLOBAL_DESIGN_SETTING_KEY = 'global_design_config';

export const DEFAULT_GLOBAL_DESIGN_CONFIG: GlobalDesignConfig = {
  logo_url: '/prime-core-logo.svg',
  primary_color: '#1687ff',
  accent_color: '#1a9bd7',
  background_color: '#ffffff',
  foreground_color: '#172033',
  card_color: '#ffffff',
  border_color: '#dbe7f3',
  primary_light_color: '#edf6ff',
  primary_glow_color: '#73b9ff',
  radius: 12,
  header_height: 56,
  bottom_nav_height: 64,
  body_font_family: 'roboto',
  section_font_family: 'condensed',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeHex = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`;
  return '';
};

const hexToHsl = (hex: string) => {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const value = normalized.slice(1);
  const red = Number.parseInt(value.slice(0, 2), 16) / 255;
  const green = Number.parseInt(value.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  if (delta !== 0) {
    switch (max) {
      case red:
        hue = 60 * (((green - blue) / delta) % 6);
        break;
      case green:
        hue = 60 * ((blue - red) / delta + 2);
        break;
      default:
        hue = 60 * ((red - green) / delta + 4);
        break;
    }
  }

  if (hue < 0) hue += 360;

  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
};

export const normalizeGlobalDesignConfig = (value: unknown): GlobalDesignConfig => {
  const raw = (value ?? {}) as Partial<GlobalDesignConfig>;
  return {
    logo_url: typeof raw.logo_url === 'string' ? raw.logo_url : DEFAULT_GLOBAL_DESIGN_CONFIG.logo_url,
    primary_color: normalizeHex(raw.primary_color ?? '') || DEFAULT_GLOBAL_DESIGN_CONFIG.primary_color,
    accent_color: normalizeHex(raw.accent_color ?? '') || DEFAULT_GLOBAL_DESIGN_CONFIG.accent_color,
    background_color: normalizeHex(raw.background_color ?? '') || DEFAULT_GLOBAL_DESIGN_CONFIG.background_color,
    foreground_color: normalizeHex(raw.foreground_color ?? '') || DEFAULT_GLOBAL_DESIGN_CONFIG.foreground_color,
    card_color: normalizeHex(raw.card_color ?? '') || DEFAULT_GLOBAL_DESIGN_CONFIG.card_color,
    border_color: normalizeHex(raw.border_color ?? '') || DEFAULT_GLOBAL_DESIGN_CONFIG.border_color,
    primary_light_color: normalizeHex(raw.primary_light_color ?? '') || DEFAULT_GLOBAL_DESIGN_CONFIG.primary_light_color,
    primary_glow_color: normalizeHex(raw.primary_glow_color ?? '') || DEFAULT_GLOBAL_DESIGN_CONFIG.primary_glow_color,
    radius: clamp(Number(raw.radius ?? DEFAULT_GLOBAL_DESIGN_CONFIG.radius), 0, 40),
    header_height: clamp(Number(raw.header_height ?? DEFAULT_GLOBAL_DESIGN_CONFIG.header_height), 44, 96),
    bottom_nav_height: clamp(Number(raw.bottom_nav_height ?? DEFAULT_GLOBAL_DESIGN_CONFIG.bottom_nav_height), 48, 96),
    body_font_family: raw.body_font_family === 'condensed' ? 'condensed' : 'roboto',
    section_font_family: raw.section_font_family === 'roboto' ? 'roboto' : 'condensed',
  };
};

export const applyGlobalDesignConfig = (config: GlobalDesignConfig) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  const primary = hexToHsl(config.primary_color) ?? DEFAULT_GLOBAL_DESIGN_CONFIG.primary_color;
  const accent = hexToHsl(config.accent_color) ?? DEFAULT_GLOBAL_DESIGN_CONFIG.accent_color;
  const background = hexToHsl(config.background_color) ?? DEFAULT_GLOBAL_DESIGN_CONFIG.background_color;
  const foreground = hexToHsl(config.foreground_color) ?? DEFAULT_GLOBAL_DESIGN_CONFIG.foreground_color;
  const card = hexToHsl(config.card_color) ?? DEFAULT_GLOBAL_DESIGN_CONFIG.card_color;
  const border = hexToHsl(config.border_color) ?? DEFAULT_GLOBAL_DESIGN_CONFIG.border_color;
  const primaryLight = hexToHsl(config.primary_light_color) ?? DEFAULT_GLOBAL_DESIGN_CONFIG.primary_light_color;
  const primaryGlow = hexToHsl(config.primary_glow_color) ?? DEFAULT_GLOBAL_DESIGN_CONFIG.primary_glow_color;

  root.style.setProperty('--primary', primary);
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--background', background);
  root.style.setProperty('--foreground', foreground);
  root.style.setProperty('--card', card);
  root.style.setProperty('--border', border);
  root.style.setProperty('--input', border);
  root.style.setProperty('--primary-light', primaryLight);
  root.style.setProperty('--primary-glow', primaryGlow);
  root.style.setProperty('--brand-blue', primary);
  root.style.setProperty('--brand-blue-light', primaryLight);
  root.style.setProperty('--brand-sky', accent);
  root.style.setProperty('--brand-navy', foreground);
  root.style.setProperty('--sidebar-background', background);
  root.style.setProperty('--sidebar-foreground', foreground);
  root.style.setProperty('--sidebar-primary', primary);
  root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
  root.style.setProperty('--sidebar-accent', primaryLight);
  root.style.setProperty('--sidebar-accent-foreground', primary);
  root.style.setProperty('--sidebar-border', border);
  root.style.setProperty('--sidebar-ring', primary);
  root.style.setProperty('--radius', `${config.radius}px`);
  root.style.setProperty('--header-height', `${config.header_height}px`);
  root.style.setProperty('--bottom-nav-height', `${config.bottom_nav_height}px`);
  root.style.setProperty('--body-font-family', config.body_font_family === 'condensed' ? "'Roboto Condensed', sans-serif" : "'Roboto', sans-serif");
  root.style.setProperty('--section-font-family', config.section_font_family === 'roboto' ? "'Roboto', sans-serif" : "'Roboto Condensed', sans-serif");
  body.style.backgroundColor = `hsl(${background})`;
};
