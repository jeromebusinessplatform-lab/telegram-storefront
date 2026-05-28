import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Bookmark, ChevronDown, Check, Navigation } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Customer, SavedAddress, ShippingAddress, CheckoutFieldsConfig } from '@/types';
import { STREET_TYPES, formatShippingAddress, inferStreetType, stripStreetType } from '@/lib/address';

// Fix Leaflet default icons in Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    village?: string;
    town?: string;
    city?: string;
    municipality?: string;
    province?: string;
    postcode?: string;
    county?: string;
    state?: string;
    building?: string;
    office?: string;
    amenity?: string;
    unit?: string;
    flat?: string;
    room?: string;
    village_green?: string;
  };
}

interface AddressSectionProps {
  address: ShippingAddress;
  onChange: (addr: ShippingAddress) => void;
  coords: { lat: number; lng: number } | null;
  onCoordsChange: (coords: { lat: number; lng: number } | null) => void;
  customer: Customer | null;
  checkoutConfig: CheckoutFieldsConfig | null;
  notes: string;
  onNotesChange: (notes: string) => void;
  saveForFuture: boolean;
  onSaveForFutureChange: (value: boolean) => void;
}

// Internal component: captures map clicks
function PinMarker({ position, setPosition }: { position: [number, number]; setPosition: (p: [number, number]) => void }) {
  useMapEvents({
    click(e) { setPosition([e.latlng.lat, e.latlng.lng]); },
  });
  return <Marker position={position} draggable eventHandlers={{ dragend: (e) => { const m = e.target; setPosition([m.getLatLng().lat, m.getLatLng().lng]); } }} />;
}

export default function AddressSection({
  address,
  onChange,
  coords,
  onCoordsChange,
  customer,
  checkoutConfig,
  notes,
  onNotesChange,
  saveForFuture,
  onSaveForFutureChange,
}: AddressSectionProps) {
  const cfg = checkoutConfig;

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Map picker
  const [showMap, setShowMap] = useState(false);
  const [mapPin, setMapPin] = useState<[number, number]>([14.7103888, 121.0544856]);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  useEffect(() => {
    if (customer?.saved_addresses) {
      setSavedAddresses(customer.saved_addresses as SavedAddress[]);
    }
  }, [customer]);

  useEffect(() => {
    setSearchQuery(address.address || '');
  }, [address.address]);

  // Debounced address search
  const searchAddress = useCallback((query: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query || query.length < 4) { setSuggestions([]); setShowSuggestions(false); return; }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Philippines')}&format=json&addressdetails=1&limit=5&countrycodes=ph`,
          { headers: { 'User-Agent': 'PRIME-CORE-App/1.0' } }
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data ?? []);
        setShowSuggestions(data.length > 0);
      } catch { setSuggestions([]); }
      setIsSearching(false);
    }, 500);
  }, []);

  const handleAddressInput = (val: string) => {
    setSearchQuery(val);
    searchAddress(val);
  };

  const buildAddress = (next: Partial<ShippingAddress>): ShippingAddress => {
    const merged = {
      ...address,
      ...next,
    };
    const street = [merged.street_name, merged.street_type].filter(Boolean).join(' ').trim();
    const full = formatShippingAddress({
      ...merged,
      address: street,
      city: merged.city_municipality || merged.city,
    });
    return {
      ...merged,
      city: merged.city_municipality || merged.city,
      address: full,
    } as ShippingAddress;
  };

  const parseGeoAddress = (a: NominatimResult['address'], displayName: string) => {
    const roadRaw = a?.road ?? '';
    const houseNumber = a?.house_number ?? '';
    const streetType = a?.road ? inferStreetType(roadRaw) : '';
    const streetName = roadRaw
      ? (stripStreetType(roadRaw) || roadRaw)
          .replace(new RegExp(`^${houseNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i'), '')
          .trim()
      : '';
    const barangayTown = a?.suburb ?? a?.neighbourhood ?? a?.village ?? a?.town ?? a?.city ?? a?.municipality ?? a?.county ?? '';
    const cityMunicipality = a?.city ?? a?.municipality ?? a?.town ?? a?.county ?? barangayTown ?? '';
    const province = a?.province ?? a?.state ?? '';
    const zip = a?.postcode ?? '';
    const subdivisionVillage = a?.building ?? a?.office ?? a?.amenity ?? '';
    return {
      house_number: houseNumber,
      street_name: streetName,
      street_type: streetType,
      subdivision_village: subdivisionVillage,
      barangay_town: barangayTown,
      city_municipality: cityMunicipality,
      province,
      zip,
      address: displayName.split(',')[0] ?? displayName,
    };
  };

  const selectSuggestion = (s: NominatimResult) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    const parsed = parseGeoAddress(s.address, s.display_name);
    const next = buildAddress(parsed);
    onChange(next);
    setSearchQuery(next.address);
    onCoordsChange({ lat, lng });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const openMapPicker = () => {
    if (coords) setMapPin([coords.lat, coords.lng]);
    setShowMap(true);
  };

  const confirmPin = async () => {
    setIsReverseGeocoding(true);
    const [lat, lng] = mapPin;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { 'User-Agent': 'PRIME-CORE-App/1.0' } }
      );
      const data = await res.json();
      const parsed = parseGeoAddress(data.address ?? {}, data.display_name ?? '');
      const newAddr = buildAddress(parsed);
      onChange(newAddr);
      setSearchQuery(newAddr.address);
      onCoordsChange({ lat, lng });
      setShowMap(false);
    } catch {
      onCoordsChange({ lat, lng });
      setShowMap(false);
    }
    setIsReverseGeocoding(false);
  };

  const loadSavedAddress = (s: SavedAddress) => {
    const next = buildAddress({
      house_number: s.house_number ?? '',
      street_name: s.street_name ?? '',
      street_type: s.street_type ?? '',
      subdivision_village: s.subdivision_village ?? '',
      barangay_town: s.barangay_town ?? '',
      city_municipality: s.city_municipality ?? s.city ?? '',
      province: s.province ?? '',
      zip: s.zip ?? '',
    });
    onChange(next);
    setSearchQuery(next.address);
    if (s.lat && s.lng) onCoordsChange({ lat: s.lat, lng: s.lng });
    setShowSaved(false);
  };

  const fullAddressPreview = formatShippingAddress(address);

  return (
    <div className="space-y-2.5">
      {/* Saved Addresses */}
      {savedAddresses.length > 0 && (
        <div>
          <button
            onClick={() => setShowSaved(v => !v)}
            className="flex items-center gap-2 text-xs font-bold text-primary bg-primary-light px-3 py-2 rounded-lg w-full"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Addresses ({savedAddresses.length})</span>
            <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${showSaved ? 'rotate-180' : ''}`} />
          </button>
          {showSaved && (
            <div className="mt-1 bg-card border border-border rounded-lg overflow-hidden shadow-brand-sm">
              {savedAddresses.map(s => (
                <button
                  key={s.id}
                  onClick={() => loadSavedAddress(s)}
                  className="flex items-start gap-2 w-full px-3 py-2.5 text-left hover:bg-muted border-b border-border last:border-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{s.address}, {s.city}</p>
                    {(s.house_number || s.street_name || s.street_type || s.subdivision_village || s.barangay_town) && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {[
                          s.house_number,
                          s.street_name,
                          s.street_type,
                          s.subdivision_village,
                          s.barangay_town,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Name + Phone */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[11px]">Full Name *</Label>
          <Input value={address.name} onChange={e => onChange({ ...address, name: e.target.value })} placeholder="Juan dela Cruz" className="h-8 text-xs mt-0.5" />
        </div>
        {(!cfg || cfg.show_phone) && (
          <div>
            <Label className="text-[11px]">Phone *</Label>
            <Input value={address.phone} onChange={e => onChange({ ...address, phone: e.target.value })} placeholder="09XX" className="h-8 text-xs mt-0.5" />
          </div>
        )}
      </div>

      {/* Search + Drop Pin */}
      {(!cfg || cfg.show_address) && (
        <div className="relative">
          <Label className="text-[11px]">Search Address *</Label>
          <div className="flex gap-1.5 mt-0.5">
            <div className="flex-1 relative">
              <Input
                value={searchQuery}
                onChange={e => handleAddressInput(e.target.value)}
                placeholder="Start typing your address..."
                className="h-8 text-xs pr-7"
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {isSearching && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map(s => (
                    <button
                      key={s.place_id}
                      onMouseDown={() => selectSuggestion(s)}
                      className="flex items-start gap-2 w-full px-3 py-2 text-left hover:bg-muted border-b border-border last:border-0"
                    >
                      <MapPin className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-[11px] text-foreground line-clamp-2">{s.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={openMapPicker}
              className="h-8 px-2.5 text-[10px] gap-1 flex-shrink-0 font-bold border-primary text-primary hover:bg-primary-light"
            >
              <Navigation className="w-3 h-3" />
              Drop Pin
            </Button>
          </div>
          {coords && (
            <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Location pinned ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})
            </p>
          )}
        </div>
      )}

      {/* Structured Address Fields */}
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Label className="text-[11px]">House / Apartment / Unit / Door / Gate No. *</Label>
          <Input value={address.house_number} onChange={e => onChange({ ...address, house_number: e.target.value })} placeholder="34" className="h-8 text-xs mt-0.5" />
        </div>
        <div>
          <Label className="text-[11px]">Street Name *</Label>
          <Input value={address.street_name} onChange={e => onChange({ ...address, street_name: e.target.value })} placeholder="Lazaro" className="h-8 text-xs mt-0.5" />
        </div>
        <div>
          <Label className="text-[11px]">Street Type *</Label>
          <Select value={address.street_type} onValueChange={value => onChange({ ...address, street_type: value })}>
            <SelectTrigger className="mt-0.5 h-8 text-xs">
              <SelectValue placeholder="Street" />
            </SelectTrigger>
            <SelectContent>
              {STREET_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-[11px]">SUBDIVISION / VILLAGE</Label>
          <Input value={address.subdivision_village} onChange={e => onChange({ ...address, subdivision_village: e.target.value })} placeholder="Subdivision or Village" className="h-8 text-xs mt-0.5" />
        </div>
        <div>
          <Label className="text-[11px]">Barangay / Town *</Label>
          <Input value={address.barangay_town} onChange={e => onChange({ ...address, barangay_town: e.target.value })} placeholder="Dalandanan" className="h-8 text-xs mt-0.5" />
        </div>
        <div>
          <Label className="text-[11px]">City / Municipality *</Label>
          <Input value={address.city_municipality} onChange={e => onChange({ ...address, city_municipality: e.target.value, city: e.target.value })} placeholder="Valenzuela City" className="h-8 text-xs mt-0.5" />
        </div>
        <div>
          <Label className="text-[11px]">Province</Label>
          <Input value={address.province} onChange={e => onChange({ ...address, province: e.target.value })} placeholder="Metro Manila" className="h-8 text-xs mt-0.5" />
        </div>
        <div>
          <Label className="text-[11px]">ZIP Code</Label>
          <Input value={address.zip} onChange={e => onChange({ ...address, zip: e.target.value })} placeholder="1234" className="h-8 text-xs mt-0.5" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-foreground">Full Address</p>
            <p className="text-[11px] text-muted-foreground">{fullAddressPreview || 'Your full address will appear here.'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={saveForFuture} onCheckedChange={onSaveForFutureChange} />
            <span className="text-[11px] font-semibold text-foreground">Save for future use</span>
          </div>
        </div>
      </div>

      {(!cfg || cfg.show_notes) && (
        <div>
          <Label className="text-[11px]">Delivery Instructions</Label>
          <Textarea value={notes} onChange={e => onNotesChange(e.target.value)} placeholder="Gate code, landmark, unit number, rider notes..." className="text-xs mt-0.5 h-16 resize-none" />
        </div>
      )}

      {/* ── Map Picker Dialog ── */}
      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Drop Pin — Tap map to set location
            </DialogTitle>
          </DialogHeader>
          <div className="h-64 w-full relative">
            <MapContainer
              center={mapPin}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              key={showMap ? 'open' : 'closed'}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <PinMarker position={mapPin} setPosition={setMapPin} />
            </MapContainer>
          </div>
          <div className="p-4 flex gap-2">
            <Button variant="outline" onClick={() => setShowMap(false)} className="flex-1 text-sm">Cancel</Button>
            <Button
              onClick={confirmPin}
              disabled={isReverseGeocoding}
              className="flex-1 btn-gradient text-sm gap-2"
            >
              <Check className="w-4 h-4" />
              {isReverseGeocoding ? 'Getting address...' : 'Confirm Location'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
