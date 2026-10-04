-- Persist FinPilot interactions and track supplier-invoice balances.
alter table public.invoices
  add column if not exists due_date date,
  add column if not exists amount_paid numeric(18, 2) not null default 0;

alter table public.invoices
  drop constraint if exists invoices_due_date_check,
  add constraint invoices_due_date_check check (due_date is null or due_date >= issue_date),
  drop constraint if exists invoices_amount_paid_check,
  add constraint invoices_amount_paid_check check (amount_paid >= 0 and amount_paid <= total_amount);

create table public.copilot_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question text not null check (char_length(trim(question)) between 2 and 500),
  intent text not null check (intent in ('period_summary', 'price_creation', 'document_review', 'unpaid_supplier_invoices', 'general')),
  answer text not null check (char_length(trim(answer)) > 0),
  amount text,
  bullets jsonb not null default '[]'::jsonb check (jsonb_typeof(bullets) = 'array'),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  created_at timestamptz not null default now()
);

create index copilot_interactions_user_created_idx
  on public.copilot_interactions(user_id, created_at desc);

alter table public.copilot_interactions enable row level security;

create policy copilot_interactions_select_own
  on public.copilot_interactions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy copilot_interactions_insert_own
  on public.copilot_interactions for insert to authenticated
  with check ((select auth.uid()) = user_id);

revoke all on table public.copilot_interactions from anon, authenticated;
grant select, insert on table public.copilot_interactions to authenticated;

comment on table public.copilot_interactions
  is 'Stores every authenticated FinPilot question and its deterministic, database-backed answer.';
