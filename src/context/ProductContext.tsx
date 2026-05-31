import { createContext, useContext, useState, useCallback } from 'react';
import { products as seedProducts, categories as seedCategories } from '@/data/products';
import type { Product, Category, Variant, Bundle } from '@/data/products';

export type { Product, Category, Variant, Bundle };

interface ProductContextType {
  products: Product[];
  categories: Category[];
  // Product CRUD
  addProduct: (p: Omit<Product, 'id' | 'rating' | 'reviews'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  // Category CRUD
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
}

const ProductContext = createContext<ProductContextType | null>(null);

let _nextId = seedProducts.length + 1;

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [categories, setCategories] = useState<Category[]>(seedCategories);

  const addProduct = useCallback((p: Omit<Product, 'id' | 'rating' | 'reviews'>) => {
    const newProduct: Product = { ...p, id: String(_nextId++), rating: 5.0, reviews: 0 };
    setProducts(prev => [...prev, newProduct]);
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const getProductById = useCallback((id: string) => {
    return products.find(p => p.id === id);
  }, [products]);

  const addCategory = useCallback((name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const newCat: Category = { id, name, icon: 'tag' };
    setCategories(prev => [...prev, newCat]);
  }, []);

  const updateCategory = useCallback((id: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id && c.id !== 'all'));
  }, []);

  return (
    <ProductContext.Provider value={{
      products, categories,
      addProduct, updateProduct, deleteProduct, getProductById,
      addCategory, updateCategory, deleteCategory,
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx) return {
    products: seedProducts,
    categories: seedCategories,
    addProduct: () => {},
    updateProduct: () => {},
    deleteProduct: () => {},
    getProductById: (id: string) => seedProducts.find(p => p.id === id),
    addCategory: () => {},
    updateCategory: () => {},
    deleteCategory: () => {},
  };
  return ctx;
}
