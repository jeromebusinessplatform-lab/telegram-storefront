-- Payment proof storage
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists payment_proofs_insert_own on storage.objects;
create policy payment_proofs_insert_own
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and auth.role() = 'authenticated'
    and (owner = auth.uid() or public.is_admin())
  );

drop policy if exists payment_proofs_update_own_or_admin on storage.objects;
create policy payment_proofs_update_own_or_admin
  on storage.objects for update
  using (
    bucket_id = 'payment-proofs'
    and (owner = auth.uid() or public.is_admin())
  )
  with check (
    bucket_id = 'payment-proofs'
    and (owner = auth.uid() or public.is_admin())
  );

drop policy if exists payment_proofs_delete_own_or_admin on storage.objects;
create policy payment_proofs_delete_own_or_admin
  on storage.objects for delete
  using (
    bucket_id = 'payment-proofs'
    and (owner = auth.uid() or public.is_admin())
  );
