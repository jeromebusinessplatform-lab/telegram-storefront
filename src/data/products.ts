export interface Variant {
  id: string;
  name: string;
  price: number;
  costing: number;
  stock: number;
}

export interface BundleItem {
  id: string;
  productId: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
}

export interface Bundle {
  id: string;
  enabled: boolean;
  items: BundleItem[];
  useGlobalPrice: boolean;
  globalPrice?: number;
}

export interface Product {
  id: string;
  name: string;
  subName?: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  description: string;
  badge?: string;
  inStock: boolean;
  specs?: string[];
  // Admin fields
  costing: number;
  stock: number;
  showStock?: boolean;
  variants: Variant[];
  bundle: Bundle | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const categories: Category[] = [
  { id: 'all', name: 'All', icon: 'grid-3x3' },
  { id: 'electronics', name: 'Electronics', icon: 'zap' },
  { id: 'fashion', name: 'Fashion', icon: 'shirt' },
  { id: 'beauty', name: 'Beauty', icon: 'sparkles' },
  { id: 'home', name: 'Home', icon: 'home' },
  { id: 'sports', name: 'Sports', icon: 'dumbbell' },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'AirPods Studio',
    price: 4499,
    originalPrice: 7299,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    category: 'electronics',
    rating: 4.8,
    reviews: 2341,
    description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio for the ultimate listening experience.',
    badge: 'Sale',
    inStock: true,
    specs: ['30hr battery', 'ANC', 'Bluetooth 5.3', 'Quick charge'],
    costing: 2500,
    stock: 24,
    variants: [],
    bundle: null,
  },
  {
    id: '2',
    name: 'Smart Watch Pro',
    price: 11199,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    category: 'electronics',
    rating: 4.9,
    reviews: 1876,
    description: 'Track your fitness, receive notifications, and monitor your health with this sleek smartwatch featuring an always-on AMOLED display.',
    badge: 'New',
    inStock: true,
    specs: ['AMOLED display', 'GPS', 'Heart rate', '5ATM water resistant'],
    costing: 6500,
    stock: 15,
    variants: [],
    bundle: null,
  },
  {
    id: '3',
    name: 'Minimal Linen Tee',
    price: 1699,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    category: 'fashion',
    rating: 4.6,
    reviews: 892,
    description: 'Crafted from 100% organic linen, this oversized tee offers effortless style and breathable comfort for any season.',
    inStock: true,
    specs: ['100% Linen', 'Oversized fit', 'Sizes XS–XXL', 'Machine wash'],
    costing: 750,
    stock: 42,
    variants: [],
    bundle: null,
  },
  {
    id: '4',
    name: 'Canvas Weekender Bag',
    price: 3099,
    originalPrice: 4499,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop',
    category: 'fashion',
    rating: 4.7,
    reviews: 543,
    description: 'A spacious waxed canvas bag that blends rugged durability with clean minimalist design. Perfect for weekend getaways.',
    badge: 'Sale',
    inStock: true,
    specs: ['Waxed canvas', 'Leather straps', '40L capacity', 'Laptop sleeve'],
    costing: 1800,
    stock: 18,
    variants: [],
    bundle: null,
  },
  {
    id: '5',
    name: 'Vitamin C Serum',
    price: 1999,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop',
    category: 'beauty',
    rating: 4.5,
    reviews: 3210,
    description: 'Brightening vitamin C serum with hyaluronic acid and niacinamide for radiant, even-toned skin. Dermatologist tested.',
    badge: 'Best Seller',
    inStock: true,
    specs: ['15% Vitamin C', 'Hyaluronic acid', 'Vegan', 'Cruelty-free'],
    costing: 850,
    stock: 67,
    variants: [],
    bundle: null,
  },
  {
    id: '6',
    name: 'Soy Wax Candle Set',
    price: 1399,
    image: 'https://images.unsplash.com/photo-1603905999088-c75a72c1ff69?w=400&h=400&fit=crop',
    category: 'home',
    rating: 4.8,
    reviews: 1124,
    description: 'Hand-poured soy wax candles in three signature scents — Cedar & Sage, Vanilla Bloom, and Sea Salt Linen.',
    inStock: true,
    specs: ['100% Soy wax', '45hr burn time', 'Set of 3', 'Lead-free wick'],
    costing: 550,
    stock: 31,
    variants: [],
    bundle: null,
  },
  {
    id: '7',
    name: 'Foam Yoga Mat',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop',
    category: 'sports',
    rating: 4.6,
    reviews: 784,
    description: 'Extra-thick 6mm non-slip yoga mat with alignment marks and carrying strap. Ideal for yoga, pilates, and stretching.',
    inStock: true,
    specs: ['6mm thick', 'Non-slip', 'Eco TPE', 'Carrying strap'],
    costing: 1200,
    stock: 22,
    variants: [],
    bundle: null,
  },
  {
    id: '8',
    name: 'Ceramic Mug',
    price: 1099,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop',
    category: 'home',
    rating: 4.7,
    reviews: 456,
    description: 'Handcrafted matte ceramic mug with a comfortable grip and minimalist design. Microwave and dishwasher safe.',
    inStock: true,
    specs: ['350ml capacity', 'Matte finish', 'Microwave safe', 'Dishwasher safe'],
    costing: 450,
    stock: 55,
    variants: [],
    bundle: null,
  },
  {
    id: '9',
    name: 'Bluetooth Speaker',
    price: 2799,
    originalPrice: 3999,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
    category: 'electronics',
    rating: 4.5,
    reviews: 2087,
    description: '360° immersive sound in a compact, waterproof design. Perfect for outdoor adventures with 24-hour battery life.',
    badge: 'Sale',
    inStock: true,
    specs: ['360° sound', 'IPX7 waterproof', '24hr battery', 'USB-C charge'],
    costing: 1500,
    stock: 33,
    variants: [],
    bundle: null,
  },
  {
    id: '10',
    name: 'Rosé Eau de Parfum',
    price: 4999,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&h=400&fit=crop',
    category: 'beauty',
    rating: 4.9,
    reviews: 634,
    description: 'A delicate floral fragrance with notes of Turkish rose, peony, and warm musk. Long-lasting and elegantly bottled.',
    badge: 'New',
    inStock: true,
    specs: ['50ml EDP', 'Long-lasting', 'Floral bouquet', 'Gift box included'],
    costing: 2200,
    stock: 12,
    variants: [],
    bundle: null,
  },
];

export const getFeatured = () => products.slice(0, 4);
export const getByCategory = (cat: string) =>
  cat === 'all' ? products : products.filter((p) => p.category === cat);
export const getById = (id: string) => products.find((p) => p.id === id);
