-- Run after creating the private `books` bucket in Supabase Storage.
-- Objects are never directly public. The application issues short-lived signed URLs
-- only after checking a customer's entitlement server-side.
insert into storage.buckets (id, name, public)
values ('books', 'books', false)
on conflict (id) do update set public = false;

-- No customer-facing storage policy is intentionally created. Only the server-side
-- secret key can create a download URL after an entitlement check.
