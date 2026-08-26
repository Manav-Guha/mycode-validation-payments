begin;

-- Server-side checkout lifecycle and staff fulfilment reads/updates.
grant select, update on public.orders to service_role;
grant select on public.order_items to service_role;
grant select, update on public.fulfilments to service_role;

-- Idempotent webhook persistence for paid products and subscriptions.
grant insert, update on public.payments, public.digital_entitlements,
  public.subscriptions to service_role;
grant select (order_id, provider_payment_reference, amount_minor, currency, status, established_at)
  on public.payments to service_role;
grant select (customer_id, product_id, source_order_id, status, revoked_at)
  on public.digital_entitlements to service_role;
grant select (customer_id, source_order_id, stripe_subscription_id, stripe_customer_id,
  status, current_period_end, cancel_at_period_end)
  on public.subscriptions to service_role;
grant update on public.profiles to service_role;
grant select (id) on public.profiles to service_role;
grant select, insert on public.webhook_events to service_role;

-- Staff audit inserts use the table's identity-backed sequence.
grant insert on public.audit_events to service_role;
grant usage on sequence public.audit_events_id_seq to service_role;

-- Subscriber content remains readable only after application authorization.
grant select on public.content_items to service_role;

commit;
