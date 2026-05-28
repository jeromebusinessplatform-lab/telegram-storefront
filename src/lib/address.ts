import type { ShippingAddress } from '@/types';

const compact = (parts: Array<string | undefined | null>) =>
  parts.map(part => part?.trim()).filter(Boolean) as string[];

export function formatShippingAddress(address: ShippingAddress | Partial<ShippingAddress> | null | undefined): string {
  if (!address) return '';
  return compact([
    address.house_number,
    address.street_name,
    address.street_type,
    address.subdivision_village,
    address.barangay_town,
    address.city_municipality ?? address.city,
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

export const STREET_TYPES = [
  'Street',
  'Avenue',
  'Road',
  'Highway',
  'Boulevard',
  'Drive',
  'Lane',
  'Court',
  'Way',
  'Trail',
  'Terrace',
  'Place',
  'Circle',
  'Alley',
  'Path',
  'Extension',
  'Expressway',
] as const;

export function inferStreetType(road: string): string {
  const normalized = road.trim().toLowerCase();
  const match = STREET_TYPES.find(type => normalized.endsWith(type.toLowerCase()));
  return match ?? '';
}

export function stripStreetType(road: string): string {
  const trimmed = road.trim();
  const type = inferStreetType(trimmed);
  if (!type) return trimmed;
  return trimmed.slice(0, Math.max(0, trimmed.toLowerCase().lastIndexOf(type.toLowerCase()))).trim().replace(/[,.-]+$/, '').trim();
}

export function composeAddressParts(address: Partial<ShippingAddress>): ShippingAddress {
  const full = formatShippingAddress(address as ShippingAddress);
  return {
    name: address.name ?? '',
    phone: address.phone ?? '',
    house_number: address.house_number ?? '',
    street_name: address.street_name ?? '',
    street_type: address.street_type ?? '',
    subdivision_village: address.subdivision_village ?? '',
    barangay_town: address.barangay_town ?? '',
    city_municipality: address.city_municipality ?? address.city ?? '',
    province: address.province ?? '',
    zip: address.zip ?? '',
    address: full,
    city: address.city_municipality ?? address.city ?? '',
  };
}
