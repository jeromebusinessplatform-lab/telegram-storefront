import type { ShippingAddress } from '@/types';

const compact = (parts: Array<string | undefined | null>) =>
  parts.map(part => part?.trim()).filter(Boolean) as string[];

export function formatShippingAddress(address: ShippingAddress | Partial<ShippingAddress> | null | undefined): string {
  if (!address) return '';
  return compact([
    address.house_number,
    address.building_name,
    address.room_number ? `Room ${address.room_number}` : undefined,
    address.apartment_number ? `Apt ${address.apartment_number}` : undefined,
    address.address,
    address.city,
    address.province,
    address.zip,
  ]).join(', ');
}

export function extractStreetLine(address: Record<string, unknown>, fallback: string): string {
  const houseNumber = typeof address.house_number === 'string' ? address.house_number.trim() : '';
  const road = typeof address.road === 'string' ? address.road.trim() : '';
  const building = typeof address.building === 'string' ? address.building.trim() : '';
  const office = typeof address.office === 'string' ? address.office.trim() : '';
  const amenity = typeof address.amenity === 'string' ? address.amenity.trim() : '';
  const suburb = typeof address.suburb === 'string' ? address.suburb.trim() : '';
  const line = compact([houseNumber, road, suburb]).join(', ');
  const named = compact([building, office, amenity]).join(', ');
  return line || named || fallback;
}
