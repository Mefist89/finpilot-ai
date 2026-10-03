-- Keep the debit and credit insert in one transaction exposed through an authenticated RPC.
create or replace function public.create_journal_entry(
  p_entry_date date,
  p_description text,
  p_debit_account_id uuid,
  p_credit_account_id uuid,
  p_amount numeric,
  p_currency text,
  p_source_document_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_entry_id uuid;
  v_active_accounts integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if p_entry_date is null then
    raise exception 'Entry date is required.' using errcode = '22023';
  end if;

  if nullif(trim(p_description), '') is null then
    raise exception 'Description is required.' using errcode = '22023';
  end if;

  if p_debit_account_id is null or p_credit_account_id is null or p_debit_account_id = p_credit_account_id then
    raise exception 'Debit and credit accounts must be different.' using errcode = '22023';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero.' using errcode = '22023';
  end if;

  if p_currency is null or upper(trim(p_currency)) !~ '^[A-Z]{3}$' then
    raise exception 'Currency must use a three-letter ISO code.' using errcode = '22023';
  end if;

  select count(*)
  into v_active_accounts
  from public.accounts
  where user_id = v_user_id
    and is_active
    and id in (p_debit_account_id, p_credit_account_id);

  if v_active_accounts <> 2 then
    raise exception 'Both accounts must belong to the current user and be active.' using errcode = '42501';
  end if;

  if p_source_document_id is not null and not exists (
    select 1
    from public.documents
    where id = p_source_document_id
      and user_id = v_user_id
  ) then
    raise exception 'The source document is not available.' using errcode = '42501';
  end if;

  insert into public.ledger_entries (
    user_id,
    source_document_id,
    entry_date,
    description,
    status
  )
  values (
    v_user_id,
    p_source_document_id,
    p_entry_date,
    trim(p_description),
    'draft'
  )
  returning id into v_entry_id;

  insert into public.ledger_lines (
    user_id,
    entry_id,
    account_id,
    line_number,
    description,
    debit,
    credit,
    currency
  )
  values
    (v_user_id, v_entry_id, p_debit_account_id, 1, trim(p_description), round(p_amount, 2), 0, upper(trim(p_currency))),
    (v_user_id, v_entry_id, p_credit_account_id, 2, trim(p_description), 0, round(p_amount, 2), upper(trim(p_currency)));

  insert into public.audit_events (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata
  )
  values (
    v_user_id,
    'ledger_entry',
    v_entry_id,
    'created',
    jsonb_build_object(
      'amount', round(p_amount, 2),
      'currency', upper(trim(p_currency)),
      'source', 'manual'
    )
  );

  return v_entry_id;
end;
$$;

revoke execute on function public.create_journal_entry(date, text, uuid, uuid, numeric, text, uuid) from public, anon;
grant execute on function public.create_journal_entry(date, text, uuid, uuid, numeric, text, uuid) to authenticated;

comment on function public.create_journal_entry(date, text, uuid, uuid, numeric, text, uuid)
  is 'Creates one balanced, two-line draft journal entry for the authenticated user.';
