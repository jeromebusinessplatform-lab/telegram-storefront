-- Order dispatch tracking link
alter table orders
  add column if not exists delivery_tracking_url text;

-- Support attachments storage
insert into storage.buckets (id, name, public)
values ('support-attachments', 'support-attachments', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists support_attachments_insert_own on storage.objects;
create policy support_attachments_insert_own
  on storage.objects for insert
  with check (
    bucket_id = 'support-attachments'
    and auth.role() = 'authenticated'
    and (owner = auth.uid() or public.is_admin())
  );

drop policy if exists support_attachments_update_own_or_admin on storage.objects;
create policy support_attachments_update_own_or_admin
  on storage.objects for update
  using (
    bucket_id = 'support-attachments'
    and (owner = auth.uid() or public.is_admin())
  )
  with check (
    bucket_id = 'support-attachments'
    and (owner = auth.uid() or public.is_admin())
  );

drop policy if exists support_attachments_delete_own_or_admin on storage.objects;
create policy support_attachments_delete_own_or_admin
  on storage.objects for delete
  using (
    bucket_id = 'support-attachments'
    and (owner = auth.uid() or public.is_admin())
  );
