import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Payload = {
  order_id?: string;
  message?: string;
};

type TelegramResult = {
  ok: boolean;
  result?: {
    message_id?: number;
  };
};

async function telegramSendMessage(token: string, payload: Record<string, unknown>): Promise<number> {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as TelegramResult;
  if (!response.ok || !data.ok || !data.result?.message_id) {
    throw new Error(`Telegram sendMessage failed: ${JSON.stringify(data)}`);
  }
  return data.result.message_id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Payload;
    const orderId = body.order_id?.trim();
    const issueMessage = body.message?.trim();

    if (!orderId || !issueMessage) {
      return new Response(JSON.stringify({ error: "order_id and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
    const adminChatIds = (Deno.env.get("TELEGRAM_ADMIN_CHAT_IDS") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!supabaseUrl || !serviceRoleKey || !botToken || adminChatIds.length === 0) {
      return new Response(JSON.stringify({ error: "Issue relay is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, customer_id, status, customers(id, telegram_id, telegram_first_name, telegram_username)")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !orderRow) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customer = orderRow.customers as { id: string; telegram_id: string; telegram_first_name?: string; telegram_username?: string } | null;
    if (!customer?.telegram_id) {
      return new Response(JSON.stringify({ error: "Customer telegram id not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingThread } = await supabase
      .from("telegram_issue_threads")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    const thread = existingThread
      ? existingThread
      : (await supabase
          .from("telegram_issue_threads")
          .insert({
            order_id: orderId,
            customer_id: customer.id,
            customer_telegram_id: customer.telegram_id,
            status: "open",
          })
          .select("*")
          .maybeSingle()
        ).data;

    if (!thread) {
      return new Response(JSON.stringify({ error: "Failed to create issue thread" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerMessage = [
      `<b>Order Issue</b>`,
      `<b>Order:</b> ${orderRow.order_number}`,
      ``,
      issueMessage,
      ``,
      `Reply here and our team will receive it.`,
    ].join("\n");

    const customerMessageId = await telegramSendMessage(botToken, {
      chat_id: customer.telegram_id,
      text: customerMessage,
      parse_mode: "HTML",
    });

    await supabase.from("telegram_message_routes").insert({
      thread_id: thread.id,
      order_id: orderId,
      customer_telegram_id: customer.telegram_id,
      admin_chat_id: "storefront-bot",
      telegram_message_id: customerMessageId,
      direction: "bot_to_customer",
    });

    const adminMessage = [
      `<b>Order Issue Alert</b>`,
      `<b>Order:</b> ${orderRow.order_number}`,
      `<b>Customer:</b> ${customer.telegram_first_name ?? "Customer"}${customer.telegram_username ? ` (@${customer.telegram_username})` : ""}`,
      ``,
      issueMessage,
      ``,
      `Reply to this message in the bot chat to send the customer an answer.`,
    ].join("\n");

    const adminMessageIds: number[] = [];
    for (const adminChatId of adminChatIds) {
      const messageId = await telegramSendMessage(botToken, {
        chat_id: adminChatId,
        text: adminMessage,
        parse_mode: "HTML",
      });
      adminMessageIds.push(messageId);
      await supabase.from("telegram_message_routes").insert({
        thread_id: thread.id,
        order_id: orderId,
        customer_telegram_id: customer.telegram_id,
        admin_chat_id: adminChatId,
        telegram_message_id: messageId,
        direction: "bot_to_admin",
      });
    }

    await supabase.from("telegram_issue_threads").update({
      status: "open",
      updated_at: new Date().toISOString(),
    }).eq("id", thread.id);

    await supabase.from("notifications").insert({
      customer_id: customer.id,
      title: `Order ${orderRow.order_number} Issue`,
      message: issueMessage,
      type: "order",
    });

    return new Response(JSON.stringify({
      success: true,
      customer_message_id: customerMessageId,
      admin_message_ids: adminMessageIds,
      thread_id: thread.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Order issue notify error:", error);
    return new Response(JSON.stringify({ error: "Failed to notify customer" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
