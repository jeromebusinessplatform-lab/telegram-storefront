import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AdminAuthPayload = {
  code?: string;
};

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of array) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlJson(value: unknown): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

async function hmacSha256(key: string, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  return new Uint8Array(signature);
}

function buildSupabaseClaims(subject: string, extras: Record<string, unknown>) {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: `${Deno.env.get("SUPABASE_URL") ?? ""}/auth/v1`,
    aud: "authenticated",
    role: "authenticated",
    sub: subject,
    exp: now + 60 * 60 * 12,
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
    const body = (await req.json()) as AdminAuthPayload;
    const code = body.code?.trim();

    if (!code) {
      return new Response(JSON.stringify({ error: "Missing admin code" }), {
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

    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "admin_access_code")
      .maybeSingle();

    const storedCode = (data?.value as { code?: string } | null)?.code ?? "PRIME2026ADMIN";
    if (!storedCode || storedCode !== code) {
      return new Response(JSON.stringify({ error: "Invalid admin code" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await signSupabaseJwt(
      buildSupabaseClaims("admin", {
        is_admin: true,
      }),
      jwtSecret,
    );

    return new Response(
      JSON.stringify({
        access_token: accessToken,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Admin auth error:", error);
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
