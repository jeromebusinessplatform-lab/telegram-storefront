const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, amount, description, success_url, cancel_url } = await req.json();

    const MAYA_SECRET_KEY = Deno.env.get("MAYA_SECRET_KEY") ?? "";
    if (!MAYA_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Maya secret key not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const credentials = btoa(`${MAYA_SECRET_KEY}:`);

    const payload = {
      totalAmount: { value: amount, currency: "PHP" },
      items: [{ name: description, quantity: 1, totalAmount: { value: amount, currency: "PHP" } }],
      redirectUrl: { success: success_url, failure: cancel_url, cancel: cancel_url },
      requestReferenceNumber: order_id,
      metadata: { order_id },
    };

    const response = await fetch("https://pg.paymaya.com/checkout/v1/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Maya error:", data);
      return new Response(JSON.stringify({ error: "Maya checkout creation failed", details: data }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      checkout_id: data.checkoutId,
      checkout_url: data.redirectUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Maya function error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
