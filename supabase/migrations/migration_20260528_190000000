-- Telegram Mini App auth helpers
create or replace function public.current_jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(auth.jwt(), '{}'::jsonb)
$$;

create or replace function public.current_claim_text(claim text)
returns text
language sql
stable
as $$
  select nullif(public.current_jwt() ->> claim, '')
$$;

create or replace function public.current_customer_id()
returns uuid
language sql
stable
as $$
  select nullif(public.current_claim_text('customer_id'), '')::uuid
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((public.current_claim_text('is_admin'))::boolean, false)
$$;

-- Customers
alter table customers enable row level security;
drop policy if exists customers_select_own on customers;
drop policy if exists customers_insert on customers;
drop policy if exists customers_update_own on customers;
create policy customers_select_self_or_admin
  on customers for select
  using (public.is_admin() or id = public.current_customer_id());
create policy customers_insert_self_or_admin
  on customers for insert
  with check (public.is_admin() or telegram_id = public.current_claim_text('telegram_id'));
create policy customers_update_self_or_admin
  on customers for update
  using (public.is_admin() or id = public.current_customer_id())
  with check (public.is_admin() or id = public.current_customer_id());

-- Public catalog/config tables: readable by everyone, writable by admin only
alter table categories enable row level security;
drop policy if exists categories_select_all on categories;
drop policy if exists categories_insert_all on categories;
drop policy if exists categories_update_all on categories;
drop policy if exists categories_delete_all on categories;
create policy categories_select_all on categories for select using (true);
create policy categories_admin_write on categories for insert with check (public.is_admin());
create policy categories_admin_update on categories for update using (public.is_admin()) with check (public.is_admin());
create policy categories_admin_delete on categories for delete using (public.is_admin());

alter table products enable row level security;
drop policy if exists products_select_active on products;
drop policy if exists products_insert_all on products;
drop policy if exists products_update_all on products;
drop policy if exists products_delete_all on products;
create policy products_select_all on products for select using (true);
create policy products_admin_write on products for insert with check (public.is_admin());
create policy products_admin_update on products for update using (public.is_admin()) with check (public.is_admin());
create policy products_admin_delete on products for delete using (public.is_admin());

alter table payment_methods enable row level security;
drop policy if exists payment_methods_select_all on payment_methods;
drop policy if exists payment_methods_insert_all on payment_methods;
drop policy if exists payment_methods_update_all on payment_methods;
drop policy if exists payment_methods_delete_all on payment_methods;
create policy payment_methods_select_all on payment_methods for select using (true);
create policy payment_methods_admin_write on payment_methods for insert with check (public.is_admin());
create policy payment_methods_admin_update on payment_methods for update using (public.is_admin()) with check (public.is_admin());
create policy payment_methods_admin_delete on payment_methods for delete using (public.is_admin());

alter table delivery_providers enable row level security;
drop policy if exists delivery_providers_select_all on delivery_providers;
drop policy if exists delivery_providers_insert_all on delivery_providers;
drop policy if exists delivery_providers_update_all on delivery_providers;
drop policy if exists delivery_providers_delete_all on delivery_providers;
create policy delivery_providers_select_all on delivery_providers for select using (true);
create policy delivery_providers_admin_write on delivery_providers for insert with check (public.is_admin());
create policy delivery_providers_admin_update on delivery_providers for update using (public.is_admin()) with check (public.is_admin());
create policy delivery_providers_admin_delete on delivery_providers for delete using (public.is_admin());

alter table fees_config enable row level security;
drop policy if exists fees_config_select_all on fees_config;
drop policy if exists fees_config_insert_all on fees_config;
drop policy if exists fees_config_update_all on fees_config;
drop policy if exists fees_config_delete_all on fees_config;
create policy fees_config_select_all on fees_config for select using (true);
create policy fees_config_admin_write on fees_config for insert with check (public.is_admin());
create policy fees_config_admin_update on fees_config for update using (public.is_admin()) with check (public.is_admin());
create policy fees_config_admin_delete on fees_config for delete using (public.is_admin());

alter table vouchers enable row level security;
drop policy if exists vouchers_select_all on vouchers;
drop policy if exists vouchers_insert_all on vouchers;
drop policy if exists vouchers_update_all on vouchers;
drop policy if exists vouchers_delete_all on vouchers;
create policy vouchers_select_all on vouchers for select using (true);
create policy vouchers_admin_write on vouchers for insert with check (public.is_admin());
create policy vouchers_admin_update on vouchers for update using (public.is_admin()) with check (public.is_admin());
create policy vouchers_admin_delete on vouchers for delete using (public.is_admin());

alter table app_settings enable row level security;
drop policy if exists app_settings_select_all on app_settings;
drop policy if exists app_settings_insert_all on app_settings;
drop policy if exists app_settings_update_all on app_settings;
drop policy if exists app_settings_delete_all on app_settings;
create policy app_settings_select_all on app_settings for select using (true);
create policy app_settings_admin_write on app_settings for insert with check (public.is_admin());
create policy app_settings_admin_update on app_settings for update using (public.is_admin()) with check (public.is_admin());
create policy app_settings_admin_delete on app_settings for delete using (public.is_admin());

-- Orders and support content belong to a customer, with admin override
alter table orders enable row level security;
drop policy if exists orders_select_all on orders;
drop policy if exists orders_insert_all on orders;
drop policy if exists orders_update_all on orders;
drop policy if exists orders_delete_all on orders;
create policy orders_select_own_or_admin
  on orders for select
  using (public.is_admin() or customer_id = public.current_customer_id());
create policy orders_insert_own_or_admin
  on orders for insert
  with check (public.is_admin() or customer_id = public.current_customer_id());
create policy orders_update_own_or_admin
  on orders for update
  using (public.is_admin() or customer_id = public.current_customer_id())
  with check (public.is_admin() or customer_id = public.current_customer_id());
create policy orders_delete_admin_only
  on orders for delete
  using (public.is_admin());

alter table support_tickets enable row level security;
drop policy if exists support_tickets_select_all on support_tickets;
drop policy if exists support_tickets_insert_all on support_tickets;
drop policy if exists support_tickets_update_all on support_tickets;
drop policy if exists support_tickets_delete_all on support_tickets;
create policy support_tickets_select_own_or_admin
  on support_tickets for select
  using (public.is_admin() or customer_id = public.current_customer_id());
create policy support_tickets_insert_own_or_admin
  on support_tickets for insert
  with check (public.is_admin() or customer_id = public.current_customer_id());
create policy support_tickets_update_own_or_admin
  on support_tickets for update
  using (public.is_admin() or customer_id = public.current_customer_id())
  with check (public.is_admin() or customer_id = public.current_customer_id());
create policy support_tickets_delete_admin_only
  on support_tickets for delete
  using (public.is_admin());

alter table support_messages enable row level security;
drop policy if exists support_messages_select_all on support_messages;
drop policy if exists support_messages_insert_all on support_messages;
drop policy if exists support_messages_update_all on support_messages;
drop policy if exists support_messages_delete_all on support_messages;
create policy support_messages_select_own_or_admin
  on support_messages for select
  using (
    public.is_admin()
    or exists (
      select 1
      from support_tickets t
      where t.id = support_messages.ticket_id
        and t.customer_id = public.current_customer_id()
    )
  );
create policy support_messages_insert_own_or_admin
  on support_messages for insert
  with check (
    public.is_admin()
    or exists (
      select 1
      from support_tickets t
      where t.id = support_messages.ticket_id
        and t.customer_id = public.current_customer_id()
    )
  );
create policy support_messages_update_admin_only
  on support_messages for update
  using (public.is_admin())
  with check (public.is_admin());
create policy support_messages_delete_admin_only
  on support_messages for delete
  using (public.is_admin());

alter table notifications enable row level security;
drop policy if exists notifications_select_all on notifications;
drop policy if exists notifications_insert_all on notifications;
drop policy if exists notifications_update_all on notifications;
drop policy if exists notifications_delete_all on notifications;
create policy notifications_select_own_or_admin
  on notifications for select
  using (public.is_admin() or customer_id = public.current_customer_id());
create policy notifications_insert_admin_only
  on notifications for insert
  with check (public.is_admin());
create policy notifications_update_own_or_admin
  on notifications for update
  using (public.is_admin() or customer_id = public.current_customer_id())
  with check (public.is_admin() or customer_id = public.current_customer_id());
create policy notifications_delete_admin_only
  on notifications for delete
  using (public.is_admin());
