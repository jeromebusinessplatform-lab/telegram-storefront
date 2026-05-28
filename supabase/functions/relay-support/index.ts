const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { ticket_number, subject, message, customer_name, telegram_id } = await req.json();

    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
    if (!BOT_TOKEN) {
      return new Response(JSON.stringify({ error: "Telegram bot token not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get support group/channel from env or settings
    // For now, relay to the customer's chat as a confirmation
    const relayMessage = `<b>🎫 Support Ticket: ${ticket_number}</b>\n\n<b>Subject:</b> ${subject}\n\n<b>Message:</b> ${message}\n\n<i>Customer: ${customer_name}</i>`;

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegram_id,
        text: relayMessage,
        parse_mode: "HTML",
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify({
      success: response.ok,
      message_id: data.result?.message_id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Relay support error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
