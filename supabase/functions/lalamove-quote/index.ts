import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

/**
 * Fee formula (applies to ALL delivery providers):
 * - Base fare        : ₱60
 * - First 4.5 km     : ₱8.00 / km
 * - 4.5 km – 5 km   : no extra charge (bridge zone)
 * - Beyond 5 km      : ₱6.50 / km  (+ ₱2.00 traffic surcharge during peak hours)
 */
function calcDeliveryFee(
  distanceKm: number,
  trafficActive: boolean
): { fee: number; breakdown: Record<string, number>; traffic_active: boolean } {
  const BASE = 60;
  const FIRST_CAP_KM = 4.5;
  const RATE_FIRST = 8.0;      // ₱8 / km for first 4.5 km
  const THRESHOLD_KM = 5.0;
  const RATE_EXTRA = 6.5;      // ₱6.50 / km beyond 5 km
  const TRAFFIC_ADD = 2.0;     // ₱2.00 / km surcharge during rush hour

  const firstKm = Math.min(distanceKm, FIRST_CAP_KM);
  const firstFee = firstKm * RATE_FIRST;

  const extraKm = Math.max(0, distanceKm - THRESHOLD_KM);
  const extraRate = trafficActive && extraKm > 0 ? RATE_EXTRA + TRAFFIC_ADD : RATE_EXTRA;
  const extraFee = extraKm * extraRate;

  const effectiveTraffic = trafficActive && extraKm > 0;
  const fee = Math.round((BASE + firstFee + extraFee) * 100) / 100;

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
      traffic_surcharge_per_km: effectiveTraffic ? TRAFFIC_ADD : 0,
    },
  };
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

  try {
    const body = await req.json();
    const destination_address: string = body.destination_address ?? "";
    const dest_lat: number | undefined = body.dest_lat;
    const dest_lng: number | undefined = body.dest_lng;

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

    // Resolve destination coordinates
    let destLat = dest_lat;
    let destLng = dest_lng;
    if (destLat === undefined || destLng === undefined) {
      const coords = await geocode(destination_address);
      if (!coords) {
        // Fallback: base fee only
        const trafficNow = isTrafficHours();
        const { fee, breakdown, traffic_active } = calcDeliveryFee(0, trafficNow);
        return new Response(
          JSON.stringify({ fee, distance_km: null, traffic_active, breakdown, message: "Could not geocode — base fee applied" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      destLat = coords.lat;
      destLng = coords.lng;
    }

    const distanceKm = haversineKm(pickupLat, pickupLng, destLat, destLng);
    const trafficNow = isTrafficHours();
    const { fee, breakdown, traffic_active } = calcDeliveryFee(distanceKm, trafficNow);

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
    return new Response(
      JSON.stringify({ fee: 60, message: "Error calculating fee" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
