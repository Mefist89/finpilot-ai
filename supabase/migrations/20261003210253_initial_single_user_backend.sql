-- Single-user FinPilot schema applied to Supabase as migration 20261003210253.
create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;

create type public.document_type as enum (
  'invoice', 'receipt', 'bank_statement', 'payment_order', 'contract',
  'timesheet', 'payroll', 'fixed_asset', 'tax_document', 'trial_balance', 'other'
);
create type public.document_status as enum ('uploaded', 'processing', 'needs_review', 'ready', 'posted', 'failed', 'rejected');
create type public.extraction_status as enum ('pending', 'processing', 'completed', 'failed');
create type public.account_type as enum ('asset', 'liability', 'equity', 'revenue', 'expense', 'off_balance');
create type public.entry_status as enum ('draft', 'approved', 'posted', 'voided');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  company_name text,
  idno text,
  vat_code text,
  base_currency text not null default 'MDL' check (base_currency ~ '^[A-Z]{3}$'),
  locale text not null default 'ro-MD',
  fiscal_year_start smallint not null default 1 check (fiscal_year_start between 1 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  automation_threshold numeric(5, 4) not null default 0.9000 check (automation_threshold between 0 and 1),
  require_review boolean not null default true,
  email_notifications boolean not null default true,
  document_retention_days integer check (document_retention_days is null or document_retention_days > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  original_filename text not null check (char_length(trim(original_filename)) > 0),
  storage_path text not null check (char_length(trim(storage_path)) > 0),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  document_type public.document_type not null default 'other',
  status public.document_status not null default 'uploaded',
  document_number text,
  counterparty_name text,
  counterparty_tax_id text,
  issue_date date,
  due_date date,
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  subtotal numeric(18, 2) check (subtotal is null or subtotal >= 0),
  vat_amount numeric(18, 2) check (vat_amount is null or vat_amount >= 0),
  total_amount numeric(18, 2) check (total_amount is null or total_amount >= 0),
  confidence numeric(5, 4) check (confidence is null or confidence between 0 and 1),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, storage_path),
  unique (user_id, sha256),
  check (due_date is null or issue_date is null or due_date >= issue_date)
);

create table public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null,
  provider text not null,
  model text,
  status public.extraction_status not null default 'pending',
  raw_text text,
  extracted_data jsonb not null default '{}'::jsonb check (jsonb_typeof(extracted_data) = 'object'),
  confidence numeric(5, 4) check (confidence is null or confidence between 0 and 1),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id),
  foreign key (document_id, user_id) references public.documents(id, user_id) on delete cascade,
  check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code text not null check (char_length(trim(code)) > 0),
  name text not null check (char_length(trim(name)) > 0),
  account_type public.account_type not null,
  parent_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, code),
  foreign key (parent_id, user_id) references public.accounts(id, user_id) on delete restrict,
  check (parent_id is null or parent_id <> id)
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_document_id uuid,
  entry_number bigint generated by default as identity,
  entry_date date not null,
  description text not null check (char_length(trim(description)) > 0),
  status public.entry_status not null default 'draft',
  approved_at timestamptz,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, entry_number),
  foreign key (source_document_id, user_id) references public.documents(id, user_id) on delete restrict,
  check (status not in ('approved', 'posted') or approved_at is not null),
  check (status <> 'posted' or posted_at is not null)
);

create table public.ledger_lines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_id uuid not null,
  account_id uuid not null,
  line_number integer not null check (line_number > 0),
  description text,
  debit numeric(18, 2) not null default 0 check (debit >= 0),
  credit numeric(18, 2) not null default 0 check (credit >= 0),
  currency text not null default 'MDL' check (currency ~ '^[A-Z]{3}$'),
  exchange_rate numeric(18, 8) not null default 1 check (exchange_rate > 0),
  created_at timestamptz not null default now(),
  unique (entry_id, line_number),
  foreign key (entry_id, user_id) references public.ledger_entries(id, user_id) on delete cascade,
  foreign key (account_id, user_id) references public.accounts(id, user_id) on delete restrict,
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity_type text not null check (char_length(trim(entity_type)) > 0),
  entity_id uuid,
  action text not null check (char_length(trim(action)) > 0),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index documents_user_created_idx on public.documents(user_id, created_at desc);
create index documents_user_status_idx on public.documents(user_id, status);
create index documents_user_type_idx on public.documents(user_id, document_type);
create index document_extractions_user_id_idx on public.document_extractions(user_id);
create index accounts_user_parent_idx on public.accounts(user_id, parent_id);
create index ledger_entries_user_date_idx on public.ledger_entries(user_id, entry_date desc);
create index ledger_entries_source_document_idx on public.ledger_entries(source_document_id);
create index ledger_lines_user_account_idx on public.ledger_lines(user_id, account_id);
create index audit_events_user_created_idx on public.audit_events(user_id, created_at desc);
create index audit_events_entity_idx on public.audit_events(user_id, entity_type, entity_id);

create function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;

  insert into public.app_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public;
revoke execute on function private.handle_new_user() from public;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger app_settings_set_updated_at before update on public.app_settings for each row execute function private.set_updated_at();
create trigger documents_set_updated_at before update on public.documents for each row execute function private.set_updated_at();
create trigger document_extractions_set_updated_at before update on public.document_extractions for each row execute function private.set_updated_at();
create trigger accounts_set_updated_at before update on public.accounts for each row execute function private.set_updated_at();
create trigger ledger_entries_set_updated_at before update on public.ledger_entries for each row execute function private.set_updated_at();
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

insert into public.profiles (id, display_name)
select id, nullif(trim(raw_user_meta_data ->> 'full_name'), '') from auth.users
on conflict (id) do nothing;

insert into public.app_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.documents enable row level security;
alter table public.document_extractions enable row level security;
alter table public.accounts enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.ledger_lines enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy app_settings_select_own on public.app_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy app_settings_update_own on public.app_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy documents_select_own on public.documents for select to authenticated using ((select auth.uid()) = user_id);
create policy documents_insert_own on public.documents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy documents_update_own on public.documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy documents_delete_own on public.documents for delete to authenticated using ((select auth.uid()) = user_id);

create policy document_extractions_select_own on public.document_extractions for select to authenticated using ((select auth.uid()) = user_id);
create policy document_extractions_insert_own on public.document_extractions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy document_extractions_update_own on public.document_extractions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy document_extractions_delete_own on public.document_extractions for delete to authenticated using ((select auth.uid()) = user_id);

create policy accounts_select_own on public.accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy accounts_insert_own on public.accounts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy accounts_update_own on public.accounts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy accounts_delete_own on public.accounts for delete to authenticated using ((select auth.uid()) = user_id);

create policy ledger_entries_select_own on public.ledger_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy ledger_entries_insert_own on public.ledger_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy ledger_entries_update_own on public.ledger_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy ledger_entries_delete_own on public.ledger_entries for delete to authenticated using ((select auth.uid()) = user_id);

create policy ledger_lines_select_own on public.ledger_lines for select to authenticated using ((select auth.uid()) = user_id);
create policy ledger_lines_insert_own on public.ledger_lines for insert to authenticated with check ((select auth.uid()) = user_id);
create policy ledger_lines_update_own on public.ledger_lines for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy ledger_lines_delete_own on public.ledger_lines for delete to authenticated using ((select auth.uid()) = user_id);

create policy audit_events_select_own on public.audit_events for select to authenticated using ((select auth.uid()) = user_id);
create policy audit_events_insert_own on public.audit_events for insert to authenticated with check ((select auth.uid()) = user_id);

revoke all on table public.profiles, public.app_settings, public.documents, public.document_extractions,
  public.accounts, public.ledger_entries, public.ledger_lines, public.audit_events from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, company_name, idno, vat_code, base_currency, locale, fiscal_year_start) on table public.profiles to authenticated;
grant select on table public.app_settings to authenticated;
grant update (automation_threshold, require_review, email_notifications, document_retention_days) on table public.app_settings to authenticated;
grant select, insert, update, delete on table public.documents, public.document_extractions, public.accounts,
  public.ledger_entries, public.ledger_lines to authenticated;
grant select, insert on table public.audit_events to authenticated;
grant usage, select on sequence public.ledger_entries_entry_number_seq, public.audit_events_id_seq to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy documents_storage_select_own on storage.objects for select to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy documents_storage_insert_own on storage.objects for insert to authenticated
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy documents_storage_update_own on storage.objects for update to authenticated
using (bucket_id = 'documents' and owner_id = (select auth.uid()::text))
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy documents_storage_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'documents' and owner_id = (select auth.uid()::text));
