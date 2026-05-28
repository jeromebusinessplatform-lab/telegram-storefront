import http from 'node:http';
import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.TELEGRAM_WEBAPP_URL;
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';
const PORT = Number(process.env.PORT ?? '3000');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
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
