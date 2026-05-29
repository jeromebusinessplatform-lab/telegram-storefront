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
};

type CustomerRow = {
  id: string;
  telegram_id: string;
  telegram_username?: string | null;
  telegram_first_name?: string | null;
  telegram_last_name?: string | null;
  customer_code: string;
  is_banned: boolean;
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

function base64UrlJson(value: unknown): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

function buildCustomerCode(): string {
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

function parseNonce(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const nonce = (body as { nonce?: unknown }).nonce;
  return typeof nonce === "string" && nonce.trim() ? nonce.trim() : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const nonce = parseNonce(body);

    if (!nonce) {
      return new Response(JSON.stringify({ error: "Missing nonce" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !jwtSecret) {
      return new Response(JSON.stringify({ error: "Auth environment is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: session, error: sessionError } = await supabase
      .from("mobile_auth_sessions")
      .select("*")
      .eq("nonce", nonce)
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Auth session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.consumed_at) {
      return new Response(JSON.stringify({ error: "Auth session already used" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Auth session expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const telegramId = String(session.telegram_id);
    const telegramUser: TelegramUser = {
      id: Number(session.telegram_id),
      first_name: session.telegram_first_name ?? "User",
      last_name: session.telegram_last_name ?? undefined,
      username: session.telegram_username ?? undefined,
    };

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
          telegram_username: telegramUser.username,
          telegram_first_name: telegramUser.first_name,
          telegram_last_name: telegramUser.last_name ?? null,
        })
        .eq("telegram_id", telegramId)
        .select("*")
        .maybeSingle();

      if (updated) customer = updated as CustomerRow;
    } else {
      let customerCode = buildCustomerCode();
      for (let attempts = 0; attempts < 10; attempts++) {
        const { data: exists } = await supabase
          .from("customers")
          .select("id")
          .eq("customer_code", customerCode)
          .maybeSingle();

        if (!exists) break;
        customerCode = buildCustomerCode();
      }

      const { data: inserted, error } = await supabase
        .from("customers")
        .insert({
          telegram_id: telegramId,
          telegram_username: telegramUser.username,
          telegram_first_name: telegramUser.first_name,
          telegram_last_name: telegramUser.last_name ?? null,
          customer_code: customerCode,
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

    await supabase
      .from("mobile_auth_sessions")
      .update({
        consumed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("nonce", nonce);

    return new Response(
      JSON.stringify({
        access_token: accessToken,
        customer,
        telegram_user: telegramUser,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Mobile auth exchange error:", error);
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
