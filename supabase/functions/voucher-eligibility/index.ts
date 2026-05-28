import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type VoucherEligibilityPayload = {
  voucher_id?: string;
  customer_id?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as VoucherEligibilityPayload;
    const voucherId = body.voucher_id?.trim();
    const customerId = body.customer_id?.trim();

    if (!voucherId || !customerId) {
      return new Response(JSON.stringify({ ok: false, message: "Missing voucher or customer" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ ok: false, message: "Validation environment is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: voucher, error: voucherError } = await supabase
      .from("vouchers")
      .select("id, single_use, allow_returning_customers, max_users")
      .eq("id", voucherId)
      .maybeSingle();

    if (voucherError || !voucher) {
      return new Response(JSON.stringify({ ok: false, message: "Voucher not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: voucherOrders }, { data: restoredLogs }, { count: customerOrderCount }] = await Promise.all([
      supabase
        .from("orders")
        .select("id, customer_id")
        .eq("voucher_id", voucherId)
        .neq("status", "cancelled"),
      supabase
        .from("voucher_audit_logs")
        .select("order_id")
        .eq("voucher_id", voucherId)
        .eq("action", "restored"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .neq("status", "cancelled"),
    ]);

    const restoredOrderIds = new Set(
      ((restoredLogs ?? []) as Array<{ order_id: string | null }>)
        .map(row => row.order_id)
        .filter((orderId): orderId is string => Boolean(orderId)),
    );

    const activeVoucherOrders = ((voucherOrders ?? []) as Array<{ id: string; customer_id: string }>)
      .filter(order => !restoredOrderIds.has(order.id));
    const customerAlreadyUsed = activeVoucherOrders.some(order => order.customer_id === customerId);
    const distinctCustomerCount = new Set(activeVoucherOrders.map(order => order.customer_id)).size;

    if (voucher.allow_returning_customers === false && (customerOrderCount ?? 0) > 0) {
      return new Response(JSON.stringify({ ok: false, message: "This voucher is for first-time customers only" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (voucher.single_use && customerAlreadyUsed) {
      return new Response(JSON.stringify({ ok: false, message: "This voucher is limited to one use per customer" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (voucher.max_users != null && !customerAlreadyUsed && distinctCustomerCount >= voucher.max_users) {
      return new Response(JSON.stringify({ ok: false, message: "This voucher has reached its number of users" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Voucher eligibility error:", error);
    return new Response(JSON.stringify({ ok: false, message: "Voucher validation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
