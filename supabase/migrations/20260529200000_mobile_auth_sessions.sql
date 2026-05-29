create table if not exists mobile_auth_sessions (
  nonce text primary key,
  telegram_id text not null,
  telegram_username text,
  telegram_first_name text,
  telegram_last_name text,
  start_param text,
  consumed_at timestamptz null,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mobile_auth_sessions_telegram_id_idx on mobile_auth_sessions (telegram_id);
create index if not exists mobile_auth_sessions_expires_at_idx on mobile_auth_sessions (expires_at);

alter table mobile_auth_sessions enable row level security;

