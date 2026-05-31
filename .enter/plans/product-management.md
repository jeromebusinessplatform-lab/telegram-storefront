# Product Management & Currency Patch

## Context
Two changes: (1) global currency swap from $ to ₱, and (2) full admin product management replacing the current read-only inventory page.

---

## 1. Currency Patch (₱ everywhere)
Replace all `$` price prefixes with `₱` in:
- `src/components/shop/ProductCard.tsx` (2 instances)
- `src/pages/ProductPage.tsx` (2 instances)
- `src/pages/CartPage.tsx` (2 instances)
- `src/pages/OrdersPage.tsx` (1 instance)
- `src/pages/ProfilePage.tsx` (1 instance)
- `src/pages/AdminPage.tsx` (1 instance)
- `src/pages/admin/CashflowPage.tsx` (1 instance)

---

## 2. Data Layer — Extend Product Interface

**`src/data/products.ts`** — add fields to `Product`:
```ts
costing: number;         // admin-only
stock: number;           // inventory count
variants: Variant[];
bundle: Bundle | null;
```

New interfaces added to products.ts:
```ts
interface Variant { id, name, price, costing, stock }
interface BundleItem { id, productId, discountType: 'fixed'|'percentage', discountValue }
interface Bundle { id, enabled, items: BundleItem[], useGlobalPrice, globalPrice? }
```

Seed all existing products with `costing: 0, stock: 10, variants: [], bundle: null`.

---

## 3. ProductContext — `src/context/ProductContext.tsx`

Manages runtime CRUD state. Initialized from products.ts seed data.

Exports:
- `products: ManagedProduct[]`
- `categories: Category[]`
- `addProduct / updateProduct / deleteProduct`
- `addCategory / updateCategory / deleteCategory`
- `useProducts()` hook

Register in `App.tsx` as `<ProductProvider>` wrapping the router.

ShopPage + ProductCard + ProductPage consume `useProducts()` instead of the static import.

---

## 4. Admin Product Management — `src/pages/admin/InventoryPage.tsx` (full rewrite)

### Layout (3 sections)

**Section A — Summary + Category Manager**
- 4 stats: Total Products, Categories, Low Stock, Out of Stock
- Category chips row: each chip shows name, pencil icon (edit inline), trash icon
- "+ Add Category" button → inline text field

**Section B — Product List**
- Search bar + category filter dropdown
- Each product row: thumbnail | name + category | ₱price | stock badge | Edit + Delete icons
- Stock badge: green (in stock), amber (≤5), red (0)
- Floating "+" FAB to open Add Product drawer

**Section C — Product Form (Bottom Drawer, 3 tabs)**

**Tab 1: Basic Info**
- Image: URL input + preview OR file upload button (stores as data URL or URL string)
- Product Name (text)
- Category (select from managed categories)
- Description (textarea)
- Price ₱ + Costing ₱ (side-by-side inputs)
- Stock (number input)

**Tab 2: Variants**
- List of variants: Name | Price ₱ | Costing ₱ | Stock | Delete
- "Add Variant" button appends new row

**Tab 3: Promotions (Bundle)**
- Toggle: "Enable Bundle / Promotion"
- When enabled — collapsible config:
  - Global price override toggle + input (fixed price for entire bundle)
  - Bundle items list: each item = Product selector + Fixed/Percentage toggle + value
  - "+ Add Product to Bundle" button
- Preview card: shows "Suggested Bundle" badge + combined savings text

---

## 5. Customer-Facing Bundle — `src/components/shop/SuggestedBundle.tsx`

Shown on `src/pages/ProductPage.tsx` when product has `bundle.enabled === true`.

UI:
- Section header: "Suggested Bundle · Buy More, Save More"
- Cards for each bundled product (thumbnail + name + discounted price)
- Summary: original total → bundle total + savings
- "Add Bundle to Cart" button → adds all items via `addItem()`

---

## 6. Files Modified Summary

| File | Change |
|------|--------|
| `src/data/products.ts` | Extend interfaces + seed defaults |
| `src/context/ProductContext.tsx` | **NEW** — CRUD state |
| `src/App.tsx` | Add `<ProductProvider>` |
| `src/pages/admin/InventoryPage.tsx` | **Full rewrite** — Product Management |
| `src/components/admin/products/ProductFormDrawer.tsx` | **NEW** — 3-tab form |
| `src/components/admin/products/BundleConfig.tsx` | **NEW** — bundle config section |
| `src/components/shop/SuggestedBundle.tsx` | **NEW** — bundle display |
| `src/pages/ShopPage.tsx` | Use ProductContext |
| `src/pages/ProductPage.tsx` | Use ProductContext + add SuggestedBundle + ₱ |
| `src/components/shop/ProductCard.tsx` | Use ProductContext + ₱ |
| `src/pages/CartPage.tsx` | ₱ |
| `src/pages/OrdersPage.tsx` | ₱ |
| `src/pages/ProfilePage.tsx` | ₱ |
| `src/pages/AdminPage.tsx` | ₱ |
| `src/pages/admin/CashflowPage.tsx` | ₱ |

---

## Verification
1. Shop shows ₱ on all prices
2. Admin → Inventory: can add/edit/delete a category
3. Admin → Inventory: can add a product with image URL, variants, and a bundle config
4. Product page shows "Suggested Bundle" when bundle is enabled
5. "Add Bundle to Cart" adds all products
6. Stock changes in admin reflect in product availability on shop
