import http from 'node:http';
import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.TELEGRAM_WEBAPP_URL;
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';
const PORT = Number(process.env.PORT ?? '3000');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAYA_WEBHOOK_ALLOWED_IPS = (process.env.MAYA_WEBHOOK_ALLOWED_IPS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const ADMIN_CHAT_IDS = (process.env.TELEGRAM_ADMIN_CHAT_IDS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is required');
if (!WEBAPP_URL) throw new Error('TELEGRAM_WEBAPP_URL is required');
if (!WEBHOOK_URL) throw new Error('TELEGRAM_WEBHOOK_URL is required');
if (!SUPABASE_URL) throw new Error('SUPABASE_URL is required');
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
if (ADMIN_CHAT_IDS.length === 0) throw new Error('TELEGRAM_ADMIN_CHAT_IDS is required');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function isAdminChat(chatId) {
  return ADMIN_CHAT_IDS.includes(String(chatId));
}

async function telegramApi(method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram API ${method} failed: ${JSON.stringify(data)}`);
  }
  return data.result;
}

async function setWebhook() {
  await telegramApi('setWebhook', {
    url: WEBHOOK_URL,
    secret_token: WEBHOOK_SECRET || undefined,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  });
}

async function sendMiniAppLaunch(chatId) {
  await telegramApi('sendMessage', {
    chat_id: chatId,
    text: 'Open the store:',
    reply_markup: {
      inline_keyboard: [[{
        text: 'Open Mini App',
        web_app: { url: WEBAPP_URL },
      }]],
    },
  });
}

async function saveMobileAuthSession(message, nonce) {
  const user = message.from;
  if (!user) return;

  await supabase.from('mobile_auth_sessions').upsert({
    nonce,
    telegram_id: String(user.id),
    telegram_username: user.username ?? null,
    telegram_first_name: user.first_name ?? null,
    telegram_last_name: user.last_name ?? null,
    start_param: nonce,
    consumed_at: null,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
}

async function sendMobileAuthReturn(chatId, nonce) {
  const webCallbackUrl = `${WEBAPP_URL.replace(/\/$/, '')}/auth/callback?nonce=${encodeURIComponent(nonce)}`;
  const nativeCallbackUrl = `primecore://auth/callback?nonce=${encodeURIComponent(nonce)}`;

  await telegramApi('sendMessage', {
    chat_id: chatId,
    text: 'Telegram authentication captured. Return to the app to finish login.',
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Open App', url: nativeCallbackUrl },
        ],
        [
          { text: 'Open Web Fallback', url: webCallbackUrl },
        ],
      ],
    },
  });
}

function getRequestIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ipFromForwarded = typeof forwardedFor === 'string'
    ? forwardedFor.split(',')[0]?.trim()
    : Array.isArray(forwardedFor)
      ? forwardedFor[0]?.split(',')[0]?.trim()
      : '';
  const realIp = typeof req.headers['x-real-ip'] === 'string' ? req.headers['x-real-ip'].trim() : '';
  const socketIp = req.socket?.remoteAddress ?? '';
  return ipFromForwarded || realIp || socketIp;
}

function isAllowedMayaWebhookIp(req) {
  if (MAYA_WEBHOOK_ALLOWED_IPS.length === 0) return true;
  const requestIp = getRequestIp(req);
  if (!requestIp) return false;
  const normalized = requestIp.replace('::ffff:', '');
  return MAYA_WEBHOOK_ALLOWED_IPS.some((allowedIp) => allowedIp === requestIp || allowedIp === normalized);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

function getReceiptData(receiptData) {
  return receiptData && typeof receiptData === 'object' && !Array.isArray(receiptData)
    ? receiptData
    : {};
}

function buildMayaReceiptState(payload) {
  const paymentStatus = String(payload?.paymentStatus ?? payload?.status ?? '').trim();
  const mayaCheckoutId = String(payload?.checkoutId ?? payload?.checkout_id ?? payload?.id ?? '').trim() || null;
  const paymentId = String(payload?.paymentId ?? payload?.payment_id ?? payload?.id ?? '').trim() || null;
  const requestReferenceNumber = String(
    payload?.requestReferenceNumber
    ?? payload?.request_reference_number
    ?? payload?.metadata?.order_id
    ?? payload?.metadata?.order_number
    ?? ''
  ).trim() || null;

  return {
    maya: {
      event_id: String(payload?.id ?? `${paymentStatus}-${requestReferenceNumber ?? 'unknown'}`),
      payment_status: paymentStatus || null,
      payment_id: paymentId,
      checkout_id: mayaCheckoutId,
      request_reference_number: requestReferenceNumber,
      updated_at: new Date().toISOString(),
      payload,
    },
  };
}

async function findOrderForMayaWebhook(payload) {
  const candidates = [
    payload?.metadata?.order_id,
    payload?.metadata?.order_number,
    payload?.requestReferenceNumber,
    payload?.request_reference_number,
    payload?.referenceNumber,
    payload?.reference_number,
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);

  const checkoutId = String(payload?.checkoutId ?? payload?.checkout_id ?? '').trim();

  for (const candidate of candidates) {
    const { data } = await supabase
      .from('orders')
      .select('*, customers(*), payment_methods(*)')
      .eq('id', candidate)
      .maybeSingle();
    if (data) return data;
  }

  if (checkoutId) {
    const { data } = await supabase
      .from('orders')
      .select('*, customers(*), payment_methods(*)')
      .eq('maya_checkout_id', checkoutId)
      .maybeSingle();
    if (data) return data;
  }

  return null;
}

async function sendMayaPaymentNotification(order, payload, paymentStatus) {
  const orderNumber = order?.order_number ?? order?.id ?? 'Unknown';
  const customerTelegramId = order?.customers?.telegram_id;
  const paymentId = payload?.paymentId ?? payload?.payment_id ?? payload?.id ?? 'N/A';
  const checkoutId = payload?.checkoutId ?? payload?.checkout_id ?? order?.maya_checkout_id ?? 'N/A';
  const referenceNumber = payload?.requestReferenceNumber ?? payload?.request_reference_number ?? order?.id ?? 'N/A';
  const statusLabel = paymentStatus === 'PAYMENT_SUCCESS'
    ? 'Paid'
    : paymentStatus === 'PAYMENT_FAILED'
      ? 'Failed'
      : paymentStatus === 'PAYMENT_EXPIRED'
        ? 'Expired'
        : paymentStatus === 'PAYMENT_CANCELLED'
          ? 'Cancelled'
          : paymentStatus || 'Updated';

  const messageLines = [
    `<b>Maya Payment ${statusLabel}</b>`,
    `<b>Order:</b> ${orderNumber}`,
    `<b>Amount:</b> ₱${Number(order?.total ?? 0).toFixed(2)}`,
    `<b>Status:</b> ${statusLabel}`,
    `<b>Reference:</b> ${referenceNumber}`,
    `<b>Checkout ID:</b> ${checkoutId}`,
    `<b>Payment ID:</b> ${paymentId}`,
  ];

  const text = messageLines.join('\n');

  if (customerTelegramId) {
    await telegramApi('sendMessage', {
      chat_id: customerTelegramId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{
          text: 'View Order',
          web_app: { url: `${WEBAPP_URL.replace(/\/$/, '')}/orders/${order.id}` },
        }]],
      },
    });
  }

  for (const adminChatId of ADMIN_CHAT_IDS) {
    await telegramApi('sendMessage', {
      chat_id: adminChatId,
      text,
      parse_mode: 'HTML',
    });
  }
}

async function getOpenThreadByCustomer(chatId) {
  const { data } = await supabase
    .from('telegram_issue_threads')
    .select('*')
    .eq('customer_telegram_id', String(chatId))
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

async function getThreadByAdminReplyMessage(messageId, adminChatId) {
  const { data } = await supabase
    .from('telegram_message_routes')
    .select('*')
    .eq('telegram_message_id', messageId)
    .eq('admin_chat_id', String(adminChatId))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

async function getThreadByCustomerReplyMessage(messageId, customerChatId) {
  const { data } = await supabase
    .from('telegram_message_routes')
    .select('*')
    .eq('telegram_message_id', messageId)
    .eq('customer_telegram_id', String(customerChatId))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

async function getOrderNumber(orderId) {
  const { data } = await supabase
    .from('orders')
    .select('order_number')
    .eq('id', orderId)
    .maybeSingle();
  return data?.order_number ?? orderId;
}

async function forwardCustomerToAdmins(message, thread) {
  const orderNumber = await getOrderNumber(thread.order_id);
  const text = [
    `<b>Order Issue Reply</b>`,
    `<b>Order:</b> ${orderNumber}`,
    '',
    message.text ?? '',
  ].join('\n');

  for (const adminChatId of ADMIN_CHAT_IDS) {
    const sent = await telegramApi('sendMessage', {
      chat_id: adminChatId,
      text,
      parse_mode: 'HTML',
    });

    await supabase.from('telegram_message_routes').insert({
      thread_id: thread.id,
      order_id: thread.order_id,
      customer_telegram_id: thread.customer_telegram_id,
      admin_chat_id: adminChatId,
      telegram_message_id: sent.message_id,
      direction: 'customer_to_admin',
    });
  }
}

async function forwardAdminReplyToCustomer(message, route) {
  const replyText = message.text?.trim();
  if (!replyText) return;

  const sent = await telegramApi('sendMessage', {
    chat_id: route.customer_telegram_id,
    text: replyText,
    parse_mode: 'HTML',
  });

  await supabase.from('telegram_message_routes').insert({
    thread_id: route.thread_id,
    order_id: route.order_id,
    customer_telegram_id: route.customer_telegram_id,
    admin_chat_id: route.admin_chat_id,
    telegram_message_id: sent.message_id,
    direction: 'admin_to_customer',
  });
}

async function handleUpdate(update) {
  const message = update?.message;
  if (!message) return;

  const chatId = message.chat?.id;
  const text = message.text ?? '';

  if (text.startsWith('/start')) {
    const payload = text.split(' ').slice(1).join(' ').trim();
    if (payload.startsWith('apk_')) {
      const nonce = payload.slice(4).trim();
      if (nonce) {
        await saveMobileAuthSession(message, nonce);
        await sendMobileAuthReturn(chatId, nonce);
      }
      return;
    }

    await sendMiniAppLaunch(chatId);
    return;
  }

  if (text.startsWith('/id')) {
    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: `Your chat ID: ${chatId}`,
    });
    return;
  }

  if (isAdminChat(chatId)) {
    const replyToMessageId = message.reply_to_message?.message_id;
    if (!replyToMessageId) return;

    const route = await getThreadByAdminReplyMessage(replyToMessageId, chatId);
    if (!route) return;

    await forwardAdminReplyToCustomer(message, route);
    return;
  }

  const replyToMessageId = message.reply_to_message?.message_id;
  const repliedRoute = replyToMessageId
    ? await getThreadByCustomerReplyMessage(replyToMessageId, chatId)
    : null;
  const thread = repliedRoute ?? await getOpenThreadByCustomer(chatId);
  if (!thread) {
    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: 'This bot is for store orders. If you have an order issue, please wait for the issue message from the store team or use the in-app support.',
    });
    return;
  }

  await forwardCustomerToAdmins(message, thread);
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? '/', 'http://localhost');

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/webhooks/maya') {
    if (!isAllowedMayaWebhookIp(req)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return;
    }

    try {
      const payload = await readJsonBody(req);
      const paymentStatus = String(payload?.paymentStatus ?? payload?.status ?? '').trim();
      const eventId = String(payload?.id ?? payload?.eventId ?? payload?.event_id ?? '').trim();

      if (!paymentStatus) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, ignored: true, reason: 'missing_payment_status' }));
        return;
      }

      const order = await findOrderForMayaWebhook(payload);
      if (!order) {
        console.warn('Maya webhook received but no matching order found:', {
          paymentStatus,
          eventId,
          requestReferenceNumber: payload?.requestReferenceNumber ?? payload?.metadata?.order_id ?? null,
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, ignored: true, reason: 'order_not_found' }));
        return;
      }

      const receiptData = getReceiptData(order.receipt_data);
      const processedIds = Array.isArray(receiptData.maya_processed_webhook_ids)
        ? receiptData.maya_processed_webhook_ids
        : [];

      if (eventId && processedIds.includes(eventId)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, duplicate: true }));
        return;
      }

      const nextReceiptData = {
        ...receiptData,
        ...buildMayaReceiptState(payload),
        maya_processed_webhook_ids: eventId
          ? Array.from(new Set([...processedIds, eventId]))
          : processedIds,
      };

      const nextStatus = paymentStatus === 'PAYMENT_SUCCESS'
        ? 'payment_verified'
        : paymentStatus === 'PAYMENT_CANCELLED' || paymentStatus === 'PAYMENT_EXPIRED' || paymentStatus === 'PAYMENT_FAILED'
          ? 'cancelled'
          : order.status;

      const updatePayload = {
        receipt_data: nextReceiptData,
        maya_checkout_id: String(payload?.checkoutId ?? payload?.checkout_id ?? order.maya_checkout_id ?? '').trim() || order.maya_checkout_id || null,
        status: nextStatus,
      };

      const { error: updateError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (updateError) {
        console.error('Failed to update order from Maya webhook:', updateError);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, warning: 'order_update_failed' }));
        return;
      }

      if (paymentStatus === 'PAYMENT_SUCCESS' && order.status !== 'payment_verified') {
        try {
          await sendMayaPaymentNotification(order, payload, paymentStatus);
        } catch (notifyError) {
          console.error('Failed to send Maya payment notification:', notifyError);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    } catch (error) {
      console.error('Maya webhook error:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad request' }));
      return;
    }
  }

  if (req.method === 'POST' && req.url === '/webhook/telegram') {
    if (WEBHOOK_SECRET) {
      const incomingSecret = req.headers['x-telegram-bot-api-secret-token'];
      if (incomingSecret !== WEBHOOK_SECRET) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString('utf8');

    try {
      const update = JSON.parse(rawBody);
      await handleUpdate(update);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      console.error('Webhook error:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad request' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

await setWebhook();
server.listen(PORT, () => {
  console.log(`Telegram bot listening on ${PORT}`);
});
