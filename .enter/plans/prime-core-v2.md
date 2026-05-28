# PRIME CORE V2 — Telegram Mini App E-Commerce

## Context
Build a full-featured Telegram Mini App e-commerce platform from scratch. The app uses Telegram WebApp SDK for customer authentication (capturing telegram_id + username on first open), a separate admin panel protected by an access code, and integrates Maya payments, Lalamove delivery, QRPH proof upload, Telegram bot notifications, referral system, support ticketing, and vouchers. Currency: PHP.

---

## Design System Changes

### `src/index.css`
- Import Nunito + Noto Sans via Google Fonts
- Update CSS tokens:
  - `--primary`: light blue (`210 100% 56%`)
  - `--accent`: sky blue (`199 89% 48%`)
  - `--background`: white (`0 0% 100%`)
  - Add `--brand-blue`, `--brand-light`, gradient tokens
- Set `font-family: 'Nunito', 'Noto Sans', sans-serif` on body

### `tailwind.config.ts`
- Extend font family: `nunito: ['Nunito', 'Noto Sans', 'sans-serif']`
- Add `brand` color tokens

---

## Database Schema (single migration)

**Tables:**
1. `customers` — telegram_id (unique), telegram_username, telegram_first_name, customer_code (8-char ALPHANUM, unique), is_banned, phone, email, address, referred_by (fk customer_code)
2. `categories` — name, sort_order
3. `products` — name, description, price, images (jsonb array), category_id, stock, variants (jsonb), is_active, sort_order
4. `payment_methods` — name, type (qrph/maya/cod/custom), details (jsonb), is_active, sort_order
5. `delivery_providers` — name, type (lalamove/manual), config (jsonb), is_active
6. `fees_config` — name, category (charge/discount/fee), value_type (percent/fixed), value, is_active, applies_always
7. `vouchers` — code (unique), discount_type, discount_value, max_uses, used_count, min_order_amount, expiry_date, is_active, is_referral, referrer_customer_code
8. `orders` — order_number (unique, auto), customer_id (fk), items (jsonb), subtotal, fees_applied (jsonb), voucher_code, voucher_discount, delivery_fee, delivery_provider_id (fk), total, status (pending/payment_submitted/payment_verified/processing/shipped/delivered/cancelled), payment_method_id (fk), payment_proof_url, maya_checkout_id, shipping_address (jsonb), receipt_data (jsonb), notes
9. `support_tickets` — ticket_number (unique, TKT-XXXXXX), customer_id (fk), subject, status (open/in_progress/resolved/closed), telegram_thread_id
10. `support_messages` — ticket_id (fk), sender_type (customer/admin), message, attachments (jsonb)
11. `notifications` — customer_id (fk), title, message, type (info/order/support), is_read
12. `app_settings` — key (unique), value (jsonb) — stores: admin_code, checkout_fields_config, receipt_fields_config, bot_config, store_info

**RLS:** Enabled on all tables. Customers read/write own records. Admin operations via service role (edge functions) or RLS bypass via `anon` key with policies per table.

**Seed app_settings:**
- `admin_access_code` → `{"code":"PRIME2026ADMIN"}`
- `store_info` → `{"name":"PRIME CORE","pickup_lat":14.7103888,"pickup_lng":121.0544856}`
- `checkout_fields_config` → default visible fields
- `receipt_fields_config` → default receipt fields
- `bot_config` → `{"support_bot":"@PrimeCoreSupportBot","bot_token":""}`

---

## File Structure

### Contexts
- `src/contexts/AuthContext.tsx` — Telegram WebApp initData parsing, customer record creation/fetching, fallback browser mode
- `src/contexts/CartContext.tsx` — Cart state with localStorage persistence
- `src/contexts/AdminContext.tsx` — Admin session (access code → verified)

### Hooks
- `src/hooks/useTelegram.ts` — `window.Telegram.WebApp` wrapper
- `src/hooks/useCustomer.ts` — fetch/create customer by telegram_id
- `src/hooks/useProducts.ts` — fetch products with filters
- `src/hooks/useOrders.ts` — CRUD orders
- `src/hooks/useVoucher.ts` — validate + apply voucher

### Layout Components
- `src/components/layout/AppLayout.tsx` — Fixed header (56px) + fixed bottom nav (56px) + scrollable content area
- `src/components/layout/Header.tsx` — Store name/logo, notification bell (badge), cart icon (badge)
- `src/components/layout/BottomNav.tsx` — 5 tabs: Home, Cart, Orders, Profile, Support
- `src/components/layout/AdminLayout.tsx` — Admin sidebar + top bar

### Customer Pages
| Route | File | Description |
|---|---|---|
| `/` | `src/pages/StorePage.tsx` | Product grid 3-col, category filter tabs |
| `/product/:id` | `src/pages/ProductDetailPage.tsx` | Images, variants, add to cart |
| `/cart` | `src/pages/CartPage.tsx` | Item list, voucher input, subtotal |
| `/checkout` | `src/pages/CheckoutPage.tsx` | Address form, payment method, delivery, fees summary |
| `/checkout/success` | `src/pages/CheckoutSuccessPage.tsx` | Order confirmed + receipt preview |
| `/orders` | `src/pages/OrdersPage.tsx` | Order history list |
| `/orders/:id` | `src/pages/OrderDetailPage.tsx` | Order detail, receipt, payment proof upload |
| `/profile` | `src/pages/ProfilePage.tsx` | Customer info, referral code + link |
| `/support` | `src/pages/SupportPage.tsx` | Ticket list + create new ticket |
| `/support/:ticketId` | `src/pages/TicketDetailPage.tsx` | Ticket messages thread |
| `/notifications` | `src/pages/NotificationsPage.tsx` | Notification list |

### Admin Pages
| Route | File | Description |
|---|---|---|
| `/admin` | `src/pages/admin/AdminLoginPage.tsx` | Access code input |
| `/admin/dashboard` | `src/pages/admin/AdminDashboard.tsx` | Stats: orders, revenue, customers |
| `/admin/products` | `src/pages/admin/AdminProductsPage.tsx` | Product list + add/edit/delete |
| `/admin/categories` | `src/pages/admin/AdminCategoriesPage.tsx` | Category management |
| `/admin/orders` | `src/pages/admin/AdminOrdersPage.tsx` | Order list + status filter |
| `/admin/orders/:id` | `src/pages/admin/AdminOrderDetailPage.tsx` | View proof, verify payment, update status |
| `/admin/customers` | `src/pages/admin/AdminCustomersPage.tsx` | Customer list + edit/ban/delete |
| `/admin/vouchers` | `src/pages/admin/AdminVouchersPage.tsx` | Voucher CRUD |
| `/admin/payments` | `src/pages/admin/AdminPaymentMethodsPage.tsx` | Payment methods CRUD |
| `/admin/delivery` | `src/pages/admin/AdminDeliveryPage.tsx` | Delivery providers CRUD |
| `/admin/fees` | `src/pages/admin/AdminFeesPage.tsx` | Fees/charges/discounts CRUD |
| `/admin/settings` | `src/pages/admin/AdminSettingsPage.tsx` | Checkout fields, receipt fields, bot token, store info |
| `/admin/support` | `src/pages/admin/AdminSupportPage.tsx` | All tickets, reply, update status |
| `/admin/notifications` | `src/pages/admin/AdminNotificationsPage.tsx` | Send notifications to customers |

### Shared UI Components
- `src/components/products/ProductCard.tsx` — tile with image, name, price
- `src/components/products/ProductGrid.tsx` — 3-col responsive grid
- `src/components/orders/OrderStatusBadge.tsx`
- `src/components/checkout/DeliveryFeeWidget.tsx` — triggers lalamove-quote edge function
- `src/components/checkout/PaymentProofUpload.tsx` — file/URL upload
- `src/components/common/ReceiptModal.tsx` — printable receipt view
- `src/components/common/ImageUploadInput.tsx` — supports URL + file upload
- `src/components/admin/DataTable.tsx` — reusable admin data table
- `src/components/admin/FeeEditor.tsx` — fee/discount editor with % or fixed toggle

---

## Edge Functions

### `supabase/functions/lalamove-quote/index.ts`
- Input: `{ destination_lat, destination_lng, service_type? }`
- Uses LALAMOVE_PUBLIC_KEY + LALAMOVE_SECRET_KEY from env
- Builds HMAC-SHA256 signature: `timestamp\r\nPOST\r\n/v3/quotations\r\n{body}`
- Endpoint: `https://rest.sandbox.lalamove.com/v3/quotations`
- Pickup fixed: `{ lat: 14.7103888, lng: 121.0544856 }`
- Returns delivery fee in PHP

### `supabase/functions/maya-checkout/index.ts`
- Input: `{ order_id, amount, description, success_url, cancel_url }`
- Uses MAYA_SECRET_KEY from env
- Endpoint: `https://pg.paymaya.com/checkout/v1/checkouts`
- Returns checkout URL + checkout_id
- Updates order with maya_checkout_id

### `supabase/functions/send-telegram-notification/index.ts`
- Input: `{ telegram_id, message, notification_data }`
- Uses TELEGRAM_BOT_TOKEN from env
- Calls Telegram Bot API `sendMessage`
- Also inserts into `notifications` table

### `supabase/functions/relay-support/index.ts`
- Input: `{ ticket_id, message, telegram_id }`
- Uses TELEGRAM_BOT_TOKEN
- Creates/updates support thread with bot

---

## Secrets Required (user must provide via supabase_add_secret)
1. `MAYA_SECRET_KEY` — Maya payment secret
2. `LALAMOVE_PUBLIC_KEY` — Lalamove public key
3. `LALAMOVE_SECRET_KEY` — Lalamove secret key
4. `TELEGRAM_BOT_TOKEN` — @PrimeCoreSupportBot token

> Note: Maya public key `pk-MwVBI7cZBwLzEtfP3jWDJHLEBNt9UsPxzW9137sLxNm` is safe to use client-side for Maya.js (if needed for hosted checkout redirect, only secret key is sensitive).

---

## Auth Flow
1. App opens → check `window.Telegram?.WebApp?.initDataUnsafe?.user`
2. If Telegram user found → query `customers` by `telegram_id`
3. If not found → generate 8-char alphanumeric `customer_code` → INSERT new customer
4. Store customer in `AuthContext`
5. If no Telegram data AND no stored session → show "Please open in Telegram" screen (with exception: if customer record was previously created, allow browser login by saved telegram_id in localStorage)
6. Admin: `/admin` route checks `AdminContext` → prompts access code → validates against `app_settings.admin_access_code`

---

## Referral System
- Each customer has a unique `customer_code` (their referral ID)
- Referral link: `https://app.url/?ref=XXXXXX`
- On first registration, if `ref` query param is present → store `referred_by`
- After referee places first order → auto-generate voucher for referrer (configurable in admin settings)

---

## Receipt Generation
- On order completion, `receipt_data` jsonb is saved with fields specified in `receipt_fields_config` settings
- `ReceiptModal` renders a printable/shareable view using receipt_data snapshot
- Admin can configure which fields show on receipt via `/admin/settings`

---

## Files to Create/Modify
- `src/index.css` — design tokens
- `tailwind.config.ts` — font + color tokens
- `index.html` — add Google Fonts link
- `src/App.tsx` — wrap with AuthProvider, CartProvider, AdminProvider
- `src/router.tsx` — all routes
- `src/integrations/supabase/client.ts` — already exists (do not modify)
- All page + component files listed above
- 4 edge function files

---

## Implementation Order
1. DB migration (all tables + RLS + seed settings)
2. Design system (CSS tokens, fonts, tailwind)
3. Supabase secrets setup prompt (Maya, Lalamove, Telegram bot token)
4. Contexts (Auth, Cart, Admin)
5. Layout (AppLayout, Header, BottomNav, AdminLayout)
6. Store + Product pages
7. Cart + Checkout pages
8. Order pages (customer)
9. Profile + Referral page
10. Support pages (customer)
11. Notifications page
12. Admin: Login, Dashboard, Products, Categories
13. Admin: Orders, Customers, Vouchers
14. Admin: Payment Methods, Delivery, Fees, Settings
15. Admin: Support panel, Notifications sender
16. Edge functions (all 4)
17. Wire everything together, lint fix
