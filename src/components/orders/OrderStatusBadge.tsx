import { OrderStatus } from '@/types';

const STATUS_MAP: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  payment_submitted: { label: 'Payment Submitted', className: 'bg-blue-100 text-blue-700' },
  payment_verified: { label: 'Payment Verified', className: 'bg-green-100 text-green-700' },
  processing: { label: 'Processing', className: 'bg-purple-100 text-purple-700' },
  dispatched: { label: 'Dispatched', className: 'bg-cyan-100 text-cyan-700' },
  shipped: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export default function OrderStatusBadge({ status, size = 'sm' }: OrderStatusBadgeProps) {
  const { label, className } = STATUS_MAP[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${className} ${
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
    }`}>
      {label}
    </span>
  );
}
