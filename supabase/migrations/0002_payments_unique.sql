create unique index if not exists uq_payments_provider_tx
  on public.payments(provider, provider_transaction_id)
  where provider_transaction_id is not null;
