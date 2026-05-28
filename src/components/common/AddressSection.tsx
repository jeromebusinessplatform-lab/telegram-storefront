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
import { Customer, SavedAddress, ShippingAddress, CheckoutFieldsConfig } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    road?: string;
    suburb?: string;
    city?: string;
    municipality?: string;
    province?: string;
    postcode?: string;
    county?: string;
    state?: string;
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
}

// Internal component: captures map clicks
function PinMarker({ position, setPosition }: { position: [number, number]; setPosition: (p: [number, number]) => void }) {
  useMapEvents({
    click(e) { setPosition([e.latlng.lat, e.latlng.lng]); },
  });
  return <Marker position={position} draggable eventHandlers={{ dragend: (e) => { const m = e.target; setPosition([m.getLatLng().lat, m.getLatLng().lng]); } }} />;
}

export default function AddressSection({ address, onChange, coords, onCoordsChange, customer, checkoutConfig, notes, onNotesChange }: AddressSectionProps) {
  const { toast } = useToast();
  const cfg = checkoutConfig;

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map picker
  const [showMap, setShowMap] = useState(false);
  const [mapPin, setMapPin] = useState<[number, number]>([14.7103888, 121.0544856]);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Save prompt
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [pendingSave, setPendingSave] = useState<{ address: ShippingAddress; coords: { lat: number; lng: number } } | null>(null);

  useEffect(() => {
    if (customer?.saved_addresses) {
      setSavedAddresses(customer.saved_addresses as SavedAddress[]);
    }
  }, [customer]);

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
    onChange({ ...address, address: val });
    searchAddress(val);
  };

  const selectSuggestion = (s: NominatimResult) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    const a = s.address ?? {};
    const road = a.road ?? '';
    const suburb = a.suburb ?? '';
    const streetLine = [road, suburb].filter(Boolean).join(', ') || s.display_name.split(',')[0];
    const city = a.city ?? a.municipality ?? a.county ?? '';
    const province = a.province ?? a.state ?? '';
    const zip = a.postcode ?? '';

    onChange({ ...address, address: streetLine, city, province, zip });
    onCoordsChange({ lat, lng });
    setSuggestions([]);
    setShowSuggestions(false);

    // Offer to save
    setPendingSave({ address: { ...address, address: streetLine, city, province, zip }, coords: { lat, lng } });
    setShowSavePrompt(true);
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
      const a = data.address ?? {};
      const road = a.road ?? a.suburb ?? '';
      const suburb = a.suburb ?? '';
      const streetLine = [road, suburb].filter((x, i, arr) => x && arr.indexOf(x) === i).join(', ') || (data.display_name?.split(',')[0] ?? '');
      const city = a.city ?? a.municipality ?? a.county ?? '';
      const province = a.province ?? a.state ?? '';
      const zip = a.postcode ?? '';

      const newAddr = { ...address, address: streetLine, city, province, zip };
      onChange(newAddr);
      onCoordsChange({ lat, lng });
      setShowMap(false);

      // Offer to save
      setPendingSave({ address: newAddr, coords: { lat, lng } });
      setShowSavePrompt(true);
    } catch {
      onCoordsChange({ lat, lng });
      setShowMap(false);
    }
    setIsReverseGeocoding(false);
  };

  const saveAddress = async () => {
    if (!customer || !pendingSave) return;
    const label = saveLabel.trim() || 'Address';
    const newSaved: SavedAddress = {
      id: crypto.randomUUID(),
      label,
      address: pendingSave.address.address,
      city: pendingSave.address.city,
      province: pendingSave.address.province,
      zip: pendingSave.address.zip,
      lat: pendingSave.coords.lat,
      lng: pendingSave.coords.lng,
    };
    const updated = [...savedAddresses, newSaved];
    await supabase.from('customers').update({ saved_addresses: updated }).eq('id', customer.id);
    setSavedAddresses(updated);
    toast({ description: `Address saved as "${label}"!` });
    setShowSavePrompt(false);
    setPendingSave(null);
    setSaveLabel('');
  };

  const loadSavedAddress = (s: SavedAddress) => {
    onChange({ ...address, address: s.address, city: s.city, province: s.province ?? '', zip: s.zip ?? '' });
    if (s.lat && s.lng) onCoordsChange({ lat: s.lat, lng: s.lng });
    setShowSaved(false);
  };

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

      {/* Street Address with autocomplete + Drop Pin */}
      {(!cfg || cfg.show_address) && (
        <div className="relative">
          <Label className="text-[11px]">Street Address *</Label>
          <div className="flex gap-1.5 mt-0.5">
            <div className="flex-1 relative">
              <Input
                value={address.address}
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

      {/* City + Province */}
      {(!cfg || cfg.show_city) && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px]">City *</Label>
            <Input value={address.city} onChange={e => onChange({ ...address, city: e.target.value })} placeholder="City" className="h-8 text-xs mt-0.5" />
          </div>
          {(!cfg || cfg.show_province) && (
            <div>
              <Label className="text-[11px]">Province</Label>
              <Input value={address.province} onChange={e => onChange({ ...address, province: e.target.value })} placeholder="Province" className="h-8 text-xs mt-0.5" />
            </div>
          )}
        </div>
      )}

      {(!cfg || cfg.show_zip) && (
        <div>
          <Label className="text-[11px]">ZIP Code</Label>
          <Input value={address.zip} onChange={e => onChange({ ...address, zip: e.target.value })} placeholder="1234" className="h-8 text-xs mt-0.5" />
        </div>
      )}

      {(!cfg || cfg.show_notes) && (
        <div>
          <Label className="text-[11px]">Order Notes</Label>
          <Textarea value={notes} onChange={e => onNotesChange(e.target.value)} placeholder="Any special instructions..." className="text-xs mt-0.5 h-16 resize-none" />
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

      {/* ── Save Address Prompt ── */}
      <Dialog open={showSavePrompt} onOpenChange={v => { if (!v) { setShowSavePrompt(false); setPendingSave(null); setSaveLabel(''); } }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-primary" />
              Save this address?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{pendingSave?.address.address}, {pendingSave?.address.city}</p>
            <div>
              <Label className="text-xs">Label (e.g. Home, Office)</Label>
              <Input
                value={saveLabel}
                onChange={e => setSaveLabel(e.target.value)}
                placeholder="Home"
                className="mt-1 h-8 text-sm"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && saveAddress()}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowSavePrompt(false); setPendingSave(null); setSaveLabel(''); }} className="flex-1 text-sm">Skip</Button>
              <Button onClick={saveAddress} className="flex-1 btn-gradient text-sm">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
