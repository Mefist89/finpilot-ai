-- Automatically propose a balanced journal entry when a purchase invoice is saved.
alter table public.ledger_entries
  add column if not exists source_invoice_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ledger_entries_source_invoice_id_user_id_fkey'
  ) then
    alter table public.ledger_entries
      add constraint ledger_entries_source_invoice_id_user_id_fkey
      foreign key (source_invoice_id, user_id)
      references public.invoices(id, user_id)
      on delete restrict;
  end if;
end;
$$;

create unique index if not exists ledger_entries_source_invoice_user_idx
  on public.ledger_entries(user_id, source_invoice_id)
  where source_invoice_id is not null;

-- Dedicated VAT subaccount used by the initial purchase-goods posting template.
insert into public.accounts (user_id, code, name, account_type, parent_id, is_active)
select
  users.id,
  '5344',
  'Datorii privind taxa pe valoarea adăugată',
  'liability'::public.account_type,
  parent.id,
  true
from auth.users as users
left join lateral (
  select account.id
  from public.accounts as account
  where account.user_id = users.id and account.code = '534'
  limit 1
) as parent on true
where not exists (
  select 1
  from public.accounts as existing
  where existing.user_id = users.id and existing.code = '5344'
);

create or replace function public.create_invoice(
  p_direction public.invoice_direction,
  p_invoice_number text,
  p_issue_date date,
  p_counterparty_name text,
  p_counterparty_tax_id text,
  p_currency text,
  p_items jsonb,
  p_source_document_id uuid default null
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invoice_id uuid;
  v_entry_id uuid;
  v_goods_account_id uuid;
  v_vat_account_id uuid;
  v_supplier_account_id uuid;
  v_item jsonb;
  v_line integer := 0;
  v_subtotal numeric(18, 2) := 0;
  v_vat numeric(18, 2) := 0;
  v_total numeric(18, 2) := 0;
  v_line_subtotal numeric(18, 2);
  v_line_vat numeric(18, 2);
  v_quantity numeric(18, 3);
  v_unit_price numeric(18, 4);
  v_vat_rate numeric(5, 2);
  v_description text;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if nullif(trim(p_invoice_number), '') is null or nullif(trim(p_counterparty_name), '') is null then raise exception 'invoice header is incomplete'; end if;
  if p_currency !~ '^[A-Z]{3}$' then raise exception 'invalid currency'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'at least one item is required'; end if;
  if p_source_document_id is not null and not exists (select 1 from public.documents where id = p_source_document_id and user_id = v_user_id) then raise exception 'source document not found'; end if;

  insert into public.invoices (user_id, direction, invoice_number, issue_date, counterparty_name, counterparty_tax_id, currency, source_document_id)
  values (v_user_id, p_direction, trim(p_invoice_number), p_issue_date, trim(p_counterparty_name), nullif(trim(p_counterparty_tax_id), ''), upper(trim(p_currency)), p_source_document_id)
  returning id into v_invoice_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_line := v_line + 1;
    v_quantity := (v_item ->> 'quantity')::numeric;
    v_unit_price := (v_item ->> 'unit_price')::numeric;
    v_vat_rate := coalesce((v_item ->> 'vat_rate')::numeric, 20);
    if nullif(trim(v_item ->> 'product_name'), '') is null or v_quantity <= 0 or v_unit_price < 0 or v_vat_rate < 0 or v_vat_rate > 100 then raise exception 'invalid invoice item'; end if;
    v_line_subtotal := round(v_quantity * v_unit_price, 2);
    v_line_vat := round(v_line_subtotal * v_vat_rate / 100, 2);
    insert into public.invoice_items (user_id, invoice_id, line_number, product_name, sku, unit, quantity, unit_price, vat_rate, subtotal, vat_amount, total_amount)
    values (v_user_id, v_invoice_id, v_line, trim(v_item ->> 'product_name'), nullif(trim(v_item ->> 'sku'), ''), coalesce(nullif(trim(v_item ->> 'unit'), ''), 'buc.'), v_quantity, v_unit_price, v_vat_rate, v_line_subtotal, v_line_vat, v_line_subtotal + v_line_vat);
    v_subtotal := v_subtotal + v_line_subtotal;
    v_vat := v_vat + v_line_vat;
  end loop;

  v_total := v_subtotal + v_vat;
  update public.invoices
  set subtotal = v_subtotal, vat_amount = v_vat, total_amount = v_total
  where id = v_invoice_id and user_id = v_user_id;

  if p_direction = 'purchase' and v_total > 0 then
    select id into v_goods_account_id
    from public.accounts
    where user_id = v_user_id and code = '217' and is_active
    limit 1;

    select id into v_vat_account_id
    from public.accounts
    where user_id = v_user_id and code in ('5344', '534') and is_active
    order by case when code = '5344' then 0 else 1 end
    limit 1;

    select id into v_supplier_account_id
    from public.accounts
    where user_id = v_user_id and code = '521' and is_active
    limit 1;

    if v_goods_account_id is null or v_vat_account_id is null or v_supplier_account_id is null then
      raise exception 'accounts 217, 5344 and 521 must be active before saving a purchase invoice';
    end if;

    v_description := format(
      'Procurarea mărfurilor conform facturii %s de la %s',
      trim(p_invoice_number),
      trim(p_counterparty_name)
    );

    insert into public.ledger_entries (
      user_id,
      source_document_id,
      source_invoice_id,
      entry_date,
      description,
      status
    ) values (
      v_user_id,
      p_source_document_id,
      v_invoice_id,
      p_issue_date,
      v_description,
      'draft'
    ) returning id into v_entry_id;

    v_line := 0;
    if v_subtotal > 0 then
      v_line := v_line + 1;
      insert into public.ledger_lines (user_id, entry_id, account_id, line_number, description, debit, credit, currency)
      values (v_user_id, v_entry_id, v_goods_account_id, v_line, 'Valoarea mărfurilor fără TVA', v_subtotal, 0, upper(trim(p_currency)));
    end if;

    if v_vat > 0 then
      v_line := v_line + 1;
      insert into public.ledger_lines (user_id, entry_id, account_id, line_number, description, debit, credit, currency)
      values (v_user_id, v_entry_id, v_vat_account_id, v_line, 'TVA deductibilă', v_vat, 0, upper(trim(p_currency)));
    end if;

    v_line := v_line + 1;
    insert into public.ledger_lines (user_id, entry_id, account_id, line_number, description, debit, credit, currency)
    values (v_user_id, v_entry_id, v_supplier_account_id, v_line, 'Datoria față de furnizor', 0, v_total, upper(trim(p_currency)));

    insert into public.audit_events (user_id, entity_type, entity_id, action, metadata)
    values (
      v_user_id,
      'ledger_entry',
      v_entry_id,
      'created',
      jsonb_build_object('source', 'purchase_invoice', 'invoice_id', v_invoice_id, 'amount', v_total, 'currency', upper(trim(p_currency)))
    );
  end if;

  if p_source_document_id is not null then
    update public.documents
    set status = 'ready'
    where id = p_source_document_id and user_id = v_user_id;
  end if;

  return v_invoice_id;
end;
$$;

revoke all on function public.create_invoice(public.invoice_direction, text, date, text, text, text, jsonb, uuid) from public;
grant execute on function public.create_invoice(public.invoice_direction, text, date, text, text, text, jsonb, uuid) to authenticated;

create or replace function public.post_journal_entry(p_entry_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_entry public.ledger_entries%rowtype;
  v_debit numeric(18, 2);
  v_credit numeric(18, 2);
begin
  if v_user_id is null then raise exception 'authentication required'; end if;

  select * into v_entry
  from public.ledger_entries
  where id = p_entry_id and user_id = v_user_id
  for update;

  if not found then raise exception 'journal entry not found'; end if;
  if v_entry.status <> 'draft' then raise exception 'only draft entries can be posted'; end if;

  select coalesce(sum(debit), 0), coalesce(sum(credit), 0)
  into v_debit, v_credit
  from public.ledger_lines
  where entry_id = p_entry_id and user_id = v_user_id;

  if v_debit <= 0 or v_credit <= 0 or abs(v_debit - v_credit) >= 0.005 then
    raise exception 'journal entry is not balanced';
  end if;

  update public.ledger_entries
  set status = 'posted', approved_at = now(), posted_at = now()
  where id = p_entry_id and user_id = v_user_id;

  if v_entry.source_document_id is not null then
    update public.documents
    set status = 'posted'
    where id = v_entry.source_document_id and user_id = v_user_id;
  end if;

  insert into public.audit_events (user_id, entity_type, entity_id, action, metadata)
  values (v_user_id, 'ledger_entry', p_entry_id, 'posted', jsonb_build_object('debit', v_debit, 'credit', v_credit));
end;
$$;

revoke all on function public.post_journal_entry(uuid) from public;
grant execute on function public.post_journal_entry(uuid) to authenticated;

comment on function public.post_journal_entry(uuid)
  is 'Validates and posts one balanced draft journal entry for the authenticated user.';
