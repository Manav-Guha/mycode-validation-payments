begin;

-- RLS decides which rows are visible; explicit grants decide which operations
-- authenticated customers may attempt. Do not rely on project default privileges.
grant usage on schema public to anon, authenticated;
grant select on public.products, public.prices to anon, authenticated;
grant select on public.profiles, public.orders, public.order_items, public.payments,
  public.fulfilments, public.digital_entitlements, public.subscriptions to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;

-- These tables remain server-only regardless of project defaults.
revoke all on public.webhook_events, public.audit_events from anon, authenticated;

commit;
