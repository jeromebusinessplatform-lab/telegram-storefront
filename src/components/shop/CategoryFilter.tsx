import { motion } from 'framer-motion';
import { categories } from '@/data/products';
import { Grid3x3, Zap, Shirt, Sparkles, Home, Dumbbell } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  'grid-3x3': Grid3x3,
  zap: Zap,
  shirt: Shirt,
  sparkles: Sparkles,
  home: Home,
  dumbbell: Dumbbell,
};

interface Props {
  active: string;
  onChange: (id: string) => void;
}

export default function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon];
        const isActive = active === cat.id;
        return (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.93 }}
            onClick={() => onChange(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-elevated'
                : 'bg-card text-muted-foreground border border-border hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {Icon && <Icon size={13} strokeWidth={isActive ? 2.2 : 1.8} />}
            {cat.name}
          </motion.button>
        );
      })}
    </div>
  );
}
