create table if not exists support_staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Support Agent',
  telegram_username text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table support_staff enable row level security;

drop policy if exists support_staff_select_admin on support_staff;
create policy support_staff_select_admin
  on support_staff for select
  using (public.is_admin());

drop policy if exists support_staff_insert_admin on support_staff;
create policy support_staff_insert_admin
  on support_staff for insert
  with check (public.is_admin());

drop policy if exists support_staff_update_admin on support_staff;
create policy support_staff_update_admin
  on support_staff for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists support_staff_delete_admin on support_staff;
create policy support_staff_delete_admin
  on support_staff for delete
  using (public.is_admin());

drop trigger if exists update_support_staff_updated_at on support_staff;
create trigger update_support_staff_updated_at
  before update on support_staff
  for each row execute function update_updated_at_column();
