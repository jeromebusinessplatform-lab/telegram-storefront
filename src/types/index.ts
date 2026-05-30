// ─── Telegram ────────────────────────────────────────────────────────────────
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramWebAppInitDataUnsafe {
  user?: TelegramUser;
  start_param?: string;
  auth_date?: number;
  hash?: string;
  query_id?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramWebAppInitDataUnsafe;
  ready(): void;
  expand(): void;
  close(): void;
  MainButton: {
    text: string;
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
  };
  BackButton: {
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
  };
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  platform: string;
  version: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// ─── Customer ─────────────────────────────────────────────────────────────────
export interface SavedAddress {
  id: string;
  label: string;
  house_number?: string;
  street_name?: string;
  street_type?: string;
  subdivision_village?: string;
  barangay_town?: string;
  city_municipality?: string;
  province?: string;
  zip?: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
}

export interface Customer {
  id: string;
  telegram_id: string;
  telegram_username?: string;
  telegram_first_name?: string;
  telegram_last_name?: string;
  customer_code: string;
  is_banned: boolean;
  phone?: string;
  email?: string;
  address?: string;
  referred_by?: string;
  saved_addresses?: SavedAddress[];
  created_at: string;
  updated_at: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface ProductVariantOption {
  label: string;
  price_modifier: number;
  stock: number;
}

export interface ProductVariant {
  name: string;
  options: ProductVariantOption[];
}

export interface Product {
  id: string;
  name: string;
  sub_name?: string;
  description?: string;
  price: number;
  images: string[];
  category_id?: string;
  stock: number;
  show_stock?: boolean;
  variants: ProductVariant[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  product_id: string;
  product_name: string;
  sub_name?: string;
  product_image: string;
  price: number;
  quantity: number;
  variant?: { name: string; option: string; price_modifier: number };
}

// ─── Payment Method ───────────────────────────────────────────────────────────
export interface PaymentMethodDetails {
  instructions?: string;
  logo_url?: string;
  qr_image?: string;
  wallet_address?: string;
  gateway_url?: string;
  gateway_channel?: 'card' | 'qrph' | 'maya' | 'all';
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  account_type?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'static_qr_code' | 'wallet_address' | 'payment_gateway' | 'business_deposit' | 'qrph' | 'maya' | 'cod' | 'custom' | 'enterprise_api';
  details: PaymentMethodDetails;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// ─── Delivery Provider ────────────────────────────────────────────────────────
export interface DeliveryConfig {
  service_type?: string;
  pricing_profile?: 'standard' | 'tier_2' | 'tier_3';
  instructions?: string;
  fee?: number;
  platform_fee?: number;
  traffic_surcharge_mode?: 'flat' | 'percent' | 'per_km';
  traffic_surcharge_value?: number;
  logo_url?: string;
}

export interface DeliveryProvider {
  id: string;
  name: string;
  type: 'dynamic' | 'manual' | 'lalamove';
  config: DeliveryConfig;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

// ─── Fees Config ──────────────────────────────────────────────────────────────
export interface FeeConfig {
  id: string;
  name: string;
  category: 'charge' | 'discount' | 'fee';
  value_type: 'percent' | 'fixed';
  value: number;
  is_active: boolean;
  applies_always: boolean;
  created_at: string;
}

export interface AppliedFee {
  name: string;
  category: string;
  value_type: string;
  amount: number;
}

// ─── Voucher ──────────────────────────────────────────────────────────────────
export interface Voucher {
  id: string;
  code: string;
  internal_voucher_uid?: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_uses?: number;
  used_count: number;
  min_order_amount: number;
  single_use?: boolean;
  allow_returning_customers?: boolean;
  max_users?: number | null;
  required_product_id?: string | null;
  required_product_quantity?: number | null;
  starts_at?: string | null;
  expiry_date?: string;
  is_active: boolean;
  is_referral: boolean;
  revoked?: boolean;
  revoked_at?: string | null;
  revoked_reason?: string | null;
  referrer_customer_code?: string;
  created_at: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'payment_submitted'
  | 'payment_verified'
  | 'processing'
  | 'dispatched'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface ShippingAddress {
  name: string;
  phone: string;
  other_contact_no?: string;
  referral_code?: string;
  house_number: string;
  street_name: string;
  street_type: string;
  subdivision_village: string;
  barangay_town: string;
  city_municipality: string;
  province: string;
  zip: string;
  address: string;
  city: string;
}

export type DeliveryFeePaymentMode = 'pay_now' | 'upon_fulfillment';

export interface OrderItem {
  product_id: string;
  name: string;
  sub_name?: string;
  price: number;
  quantity: number;
  variant?: string;
  image: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  items: OrderItem[];
  subtotal: number;
  fees_applied: AppliedFee[];
  voucher_code?: string;
  voucher_id?: string | null;
  voucher_discount: number;
  delivery_fee: number;
  delivery_fee_payment_mode?: DeliveryFeePaymentMode;
  delivery_provider_id?: string;
  delivery_tracking_url?: string | null;
  total: number;
  status: OrderStatus;
  payment_method_id?: string;
  payment_proof_url?: string;
  maya_checkout_id?: string;
  shipping_address: ShippingAddress;
  receipt_data: Record<string, unknown>;
  notes?: string;
  created_at: string;
  updated_at: string;
  customers?: Customer;
  payment_methods?: PaymentMethod;
  delivery_providers?: DeliveryProvider;
}

// ─── Support ──────────────────────────────────────────────────────────────────
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  customer_id: string;
  subject: string;
  status: TicketStatus;
  telegram_thread_id?: string;
  created_at: string;
  updated_at: string;
  customers?: Customer;
  support_messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: 'customer' | 'admin';
  message: string;
  attachments: string[];
  created_at: string;
}

export interface SupportStaff {
  id: string;
  name: string;
  role: string;
  telegram_username?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  customer_id: string;
  title: string;
  message: string;
  type: 'info' | 'order' | 'support';
  is_read: boolean;
  created_at: string;
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export interface StoreInfo {
  name: string;
  tagline: string;
  pickup_lat: number;
  pickup_lng: number;
  currency: string;
  currency_symbol: string;
}

export interface AnnouncementConfig {
  enabled: boolean;
  display_mode: 'text' | 'image' | 'both';
  title: string;
  body_markdown: string;
  banner_image_url: string;
  banner_alt: string;
  auto_publish?: boolean;
  publish_at?: string;
  auto_takedown?: boolean;
  takedown_at?: string;
  font_family?: 'nunito' | 'noto' | 'serif' | 'mono';
  font_style?: 'normal' | 'italic';
  text_color?: string;
  accent_color?: string;
  visual_style?: 'clean' | 'soft' | 'bold' | 'outlined';
}

export type PageBuilderBlockType = 'hero' | 'text' | 'image' | 'button' | 'spacer';
export type PageBuilderFontFamily = 'body' | 'condensed' | 'serif' | 'mono';
export type PageBuilderTextAlign = 'left' | 'center' | 'right';
export type PageBuilderImageFit = 'cover' | 'contain';

export interface PageBuilderBlockStyle {
  font_family: PageBuilderFontFamily;
  font_style: 'normal' | 'italic';
  text_color: string;
  accent_color: string;
  background_color: string;
  alignment: PageBuilderTextAlign;
  image_fit: PageBuilderImageFit;
  image_position_x: number;
  image_position_y: number;
  image_zoom: number;
  border_radius: number;
  remove_background: boolean;
}

export interface PageBuilderBlock {
  id: string;
  type: PageBuilderBlockType;
  enabled: boolean;
  title: string;
  body_markdown: string;
  image_url: string;
  image_alt: string;
  button_label: string;
  button_href: string;
  sort_order: number;
  style: PageBuilderBlockStyle;
}

export interface PageBuilderPage {
  slug: string;
  label: string;
  blocks: PageBuilderBlock[];
}

export interface PageBuilderConfig {
  enabled: boolean;
  pages: PageBuilderPage[];
}

export interface CheckoutFieldsConfig {
  show_phone: boolean;
  show_email: boolean;
  show_address: boolean;
  show_city: boolean;
  show_province: boolean;
  show_zip: boolean;
  show_notes: boolean;
}

export interface ReceiptFieldsConfig {
  show_order_number: boolean;
  show_customer_name: boolean;
  show_customer_code: boolean;
  show_items: boolean;
  show_fees: boolean;
  show_delivery_fee: boolean;
  show_voucher: boolean;
  show_total: boolean;
  show_payment_method: boolean;
  show_date: boolean;
  show_store_name: boolean;
}

export interface BotConfig {
  support_bot_username: string;
  bot_token: string;
  notifications_enabled: boolean;
  support_relay_enabled: boolean;
}

export interface ReferralConfig {
  enabled: boolean;
  referrer_reward_type: 'percent' | 'fixed';
  referrer_reward_value: number;
  referee_reward_type: 'percent' | 'fixed';
  referee_reward_value: number;
}
