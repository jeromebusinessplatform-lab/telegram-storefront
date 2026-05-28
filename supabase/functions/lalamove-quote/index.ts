import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DeliveryProviderRow = {
  id: string;
  type: string;
  config: {
    pricing_profile?: "standard" | "tier_2" | "tier_3";
    fee?: number;
    platform_fee?: number;
    traffic_surcharge_mode?: "flat" | "percent" | "per_km";
    traffic_surcharge_value?: number;
    instructions?: string;
    logo_url?: string;
  } | null;
};

type FeeProfile = {
  baseFare: number;
  firstKmRate: number;
  extraRate: number;
};

const DELIVERY_PROFILES: Record<string, FeeProfile> = {
  standard: { baseFare: 60, firstKmRate: 8, extraRate: 6.5 },
  tier_2: { baseFare: 65, firstKmRate: 8, extraRate: 11 },
  tier_3: { baseFare: 70, firstKmRate: 8, extraRate: 8 },
};

/** Haversine distance in km */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Detect peak-hour traffic in the Philippines (UTC+8).
 * Mon–Fri: 7:00–9:30 AM  |  5:00–8:00 PM
 */
function isTrafficHours(): boolean {
  // Shift to PH time (UTC+8)
  const ph = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const day = ph.getUTCDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false; // weekends — no traffic surcharge

  const mins = ph.getUTCHours() * 60 + ph.getUTCMinutes();
  const morningRush = mins >= 420 && mins <= 570;  // 7:00–9:30 AM
  const eveningRush = mins >= 1020 && mins <= 1200; // 5:00–8:00 PM
  return morningRush || eveningRush;
}

function getFeeProfile(profileKey?: string | null): FeeProfile {
  return DELIVERY_PROFILES[profileKey ?? "standard"] ?? DELIVERY_PROFILES.standard;
}

/**
 * Fee formula for the dynamic delivery profiles:
 * - Base fare        : profile-dependent
 * - Route distance    : computed from pickup/drop-off points
 * - First 4.9 km     : ₱8.00 / km
 * - Beyond 5 km      : profile-dependent / km
 * - Traffic surcharge : optional, admin-controlled
 * - Platform fee      : optional, admin-controlled
 */
function calcDeliveryFee(
  distanceKm: number,
  trafficActive: boolean,
  profileKey?: string | null,
  config?: DeliveryProviderRow["config"]
): { fee: number; breakdown: Record<string, number>; traffic_active: boolean } {
  const profile = getFeeProfile(profileKey);
  const BASE = profile.baseFare;
  const FIRST_CAP_KM = 4.9;
  const RATE_FIRST = profile.firstKmRate; // ₱8 / km for first 4.9 km
  const THRESHOLD_KM = 5.0;
  const RATE_EXTRA = profile.extraRate;
  const PLATFORM_FEE = Math.max(0, config?.platform_fee ?? 0);
  const TRAFFIC_MODE = config?.traffic_surcharge_mode ?? "flat";
  const TRAFFIC_VALUE = Math.max(0, config?.traffic_surcharge_value ?? 0);

  const firstKm = Math.min(distanceKm, FIRST_CAP_KM);
  const firstFee = firstKm * RATE_FIRST;

  const extraKm = Math.max(0, distanceKm - THRESHOLD_KM);
  const trafficFee =
    trafficActive
      ? TRAFFIC_MODE === "percent"
        ? ((BASE + firstFee + extraKm * RATE_EXTRA) * TRAFFIC_VALUE) / 100
        : TRAFFIC_MODE === "per_km"
          ? distanceKm * TRAFFIC_VALUE
          : TRAFFIC_VALUE
      : 0;
  const extraRate = RATE_EXTRA;
  const extraFee = extraKm * extraRate;

  const effectiveTraffic = trafficActive && trafficFee > 0;
  const fee = Math.round((BASE + firstFee + extraFee + trafficFee + PLATFORM_FEE) * 100) / 100;

  return {
    fee,
    traffic_active: effectiveTraffic,
    breakdown: {
      base: BASE,
      first_km: parseFloat(firstKm.toFixed(2)),
      first_fee: parseFloat(firstFee.toFixed(2)),
      extra_km: parseFloat(extraKm.toFixed(2)),
      extra_rate: extraRate,
      extra_fee: parseFloat(extraFee.toFixed(2)),
      traffic_fee: parseFloat(trafficFee.toFixed(2)),
      traffic_surcharge_value: trafficActive ? TRAFFIC_VALUE : 0,
      platform_fee: parseFloat(PLATFORM_FEE.toFixed(2)),
    },
  };
}

async function routeDistanceKm(
  pickupLat: number,
  pickupLng: number,
  destLat: number,
  destLng: number
): Promise<number> {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${pickupLng},${pickupLat};${destLng},${destLat}?overview=false`
    );
    const data = await res.json();
    const distance = data?.routes?.[0]?.distance;
    if (typeof distance === "number" && distance > 0) {
      return distance / 1000;
    }
  } catch (e) {
    console.error("Routing error:", e);
  }

  return haversineKm(pickupLat, pickupLng, destLat, destLng) * 1.18;
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encoded = encodeURIComponent(address + ", Philippines");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=ph`,
      { headers: { "User-Agent": "PRIME-CORE-App/1.0" } }
    );
    const data = await res.json();
    if (data?.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.error("Geocoding error:", e);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let providerProfile: string | null | undefined = undefined;
  let providerConfig: DeliveryProviderRow["config"] = undefined;

  try {
    const body = await req.json();
    const destination_address: string = body.destination_address ?? "";
    const dest_lat: number | undefined = body.dest_lat;
    const dest_lng: number | undefined = body.dest_lng;
    const deliveryProviderId: string | undefined = body.delivery_provider_id;

    if (!destination_address && (dest_lat === undefined || dest_lng === undefined)) {
      return new Response(
        JSON.stringify({ error: "destination_address or dest_lat/dest_lng required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get pickup coords from store settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: storeRow } = await supabase
      .from("app_settings").select("value").eq("key", "store_info").maybeSingle();
    const storeInfo = storeRow?.value as { pickup_lat?: number; pickup_lng?: number } | null;
    const pickupLat = storeInfo?.pickup_lat ?? 14.7103888;
    const pickupLng = storeInfo?.pickup_lng ?? 121.0544856;

    if (deliveryProviderId) {
      const { data: providerRow } = await supabase
        .from("delivery_providers")
        .select("id, type, config")
        .eq("id", deliveryProviderId)
        .maybeSingle();
      const provider = providerRow as DeliveryProviderRow | null;
      providerProfile = provider?.config?.pricing_profile;
      providerConfig = provider?.config ?? undefined;
    }

    // Resolve destination coordinates
    let destLat = dest_lat;
    let destLng = dest_lng;
    if (destLat === undefined || destLng === undefined) {
      const coords = await geocode(destination_address);
      if (!coords) {
        // Fallback: base fee only
        const trafficNow = isTrafficHours();
        const { fee, breakdown, traffic_active } = calcDeliveryFee(0, trafficNow, providerProfile, providerConfig);
        return new Response(
          JSON.stringify({ fee, distance_km: null, traffic_active, breakdown, message: "Could not geocode — base fee applied" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      destLat = coords.lat;
      destLng = coords.lng;
    }

    const distanceKm = await routeDistanceKm(pickupLat, pickupLng, destLat, destLng);
    const trafficNow = isTrafficHours();
    const { fee, breakdown, traffic_active } = calcDeliveryFee(distanceKm, trafficNow, providerProfile, providerConfig);

    console.log(`Distance: ${distanceKm.toFixed(2)} km | Traffic: ${trafficNow} | Fee: ₱${fee}`);

    return new Response(
      JSON.stringify({
        fee,
        distance_km: parseFloat(distanceKm.toFixed(2)),
        traffic_active,
        currency: "PHP",
        breakdown,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("delivery-fee error:", error);
    const { fee } = calcDeliveryFee(0, false, providerProfile, providerConfig);
    return new Response(
      JSON.stringify({ fee, message: "Error calculating fee" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
