import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

type TelegramAuthPayload = {
  init_data?: string;
  ref_code?: string;
};

type CustomerRow = {
  id: string;
  telegram_id: string;
  telegram_username?: string | null;
  telegram_first_name?: string | null;
  telegram_last_name?: string | null;
  customer_code: string;
  is_banned: boolean;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  referred_by?: string | null;
  created_at: string;
  updated_at: string;
};

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of array) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64UrlJson(value: unknown): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

async function hmacSha256(key: string | Uint8Array, message: string): Promise<Uint8Array> {
  const rawKey = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  return new Uint8Array(signature);
}

function parseInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const result: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

async function verifyTelegramInitData(initData: string, botToken: string): Promise<{ user: TelegramUser; authDate: number; startParam?: string }> {
  const parsed = parseInitData(initData);
  const receivedHash = parsed.hash;
  const authDate = Number(parsed.auth_date);
  const userRaw = parsed.user;
  const startParam = parsed.start_param;

  if (!receivedHash || !userRaw || !Number.isFinite(authDate)) {
    throw new Error("Invalid Telegram init data");
  }

  const maxAgeSeconds = 60 * 60 * 24;
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > maxAgeSeconds) {
    throw new Error("Telegram init data expired");
  }

  const dataCheckString = Object.entries(parsed)
    .filter(([key]) => key !== "hash" && key !== "signature")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = await hmacSha256("WebAppData", botToken);
  const computedHash = toHex(await hmacSha256(secretKey, dataCheckString));

  if (computedHash !== receivedHash) {
    throw new Error("Telegram hash verification failed");
  }

  return {
    user: JSON.parse(userRaw) as TelegramUser,
    authDate,
    startParam,
  };
}

function generateCustomerCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function buildSupabaseClaims(subject: string, extras: Record<string, unknown>) {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: `${Deno.env.get("SUPABASE_URL") ?? ""}/auth/v1`,
    aud: "authenticated",
    role: "authenticated",
    sub: subject,
    exp: now + 60 * 60 * 24 * 7,
    iat: now,
    aal: "aal1",
    session_id: crypto.randomUUID(),
    email: "",
    phone: "",
    is_anonymous: false,
    ...extras,
  };
}

async function signSupabaseJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlJson(header);
  const encodedPayload = base64UrlJson(payload);
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSha256(secret, message);
  return `${message}.${base64UrlEncode(signature)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as TelegramAuthPayload;
    const initData = body.init_data?.trim();

    if (!initData) {
      return new Response(JSON.stringify({ error: "Missing Telegram init data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET") ?? "";

    if (!botToken || !supabaseUrl || !serviceRoleKey || !jwtSecret) {
      return new Response(JSON.stringify({ error: "Auth environment is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user, startParam } = await verifyTelegramInitData(initData, botToken);
    const telegramId = String(user.id);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existing } = await supabase
      .from("customers")
      .select("*")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    let customer = existing as CustomerRow | null;

    if (customer) {
      const { data: updated } = await supabase
        .from("customers")
        .update({
          telegram_username: user.username,
          telegram_first_name: user.first_name,
          telegram_last_name: user.last_name ?? null,
        })
        .eq("telegram_id", telegramId)
        .select("*")
        .maybeSingle();

      if (updated) {
        customer = updated as CustomerRow;
      }
    } else {
      let customerCode = generateCustomerCode();
      for (let attempts = 0; attempts < 10; attempts++) {
        const { data: exists } = await supabase
          .from("customers")
          .select("id")
          .eq("customer_code", customerCode)
          .maybeSingle();

        if (!exists) break;
        customerCode = generateCustomerCode();
      }

      const { data: inserted, error } = await supabase
        .from("customers")
        .insert({
          telegram_id: telegramId,
          telegram_username: user.username,
          telegram_first_name: user.first_name,
          telegram_last_name: user.last_name ?? null,
          customer_code: customerCode,
          referred_by: body.ref_code ?? startParam ?? null,
        })
        .select("*")
        .maybeSingle();

      if (error || !inserted) {
        return new Response(JSON.stringify({ error: "Failed to create customer" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      customer = inserted as CustomerRow;
    }

    const accessToken = await signSupabaseJwt(
      buildSupabaseClaims(customer.id, {
        telegram_id: telegramId,
        customer_id: customer.id,
        customer_code: customer.customer_code,
      }),
      jwtSecret,
    );

    return new Response(
      JSON.stringify({
        access_token: accessToken,
        customer,
        telegram_user: user,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Telegram auth error:", error);
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
