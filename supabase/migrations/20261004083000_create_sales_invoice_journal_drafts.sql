-- Create a balanced draft entry after totals are calculated for an issued invoice.
create or replace function private.create_sale_invoice_journal_draft()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_entry_id uuid;
  v_receivable_account_id uuid;
  v_revenue_account_id uuid;
  v_vat_account_id uuid;
  v_line integer := 1;
  v_description text;
begin
  if new.direction <> 'sale' or new.total_amount <= 0 then
    return new;
  end if;

  if exists (
    select 1
    from public.ledger_entries
    where user_id = new.user_id and source_invoice_id = new.id
  ) then
    return new;
  end if;

  select id into v_receivable_account_id
  from public.accounts
  where user_id = new.user_id and code = '221' and is_active
  limit 1;

  select id into v_revenue_account_id
  from public.accounts
  where user_id = new.user_id and code = '611' and is_active
  limit 1;

  select id into v_vat_account_id
  from public.accounts
  where user_id = new.user_id and code in ('5344', '534') and is_active
  order by case when code = '5344' then 0 else 1 end
  limit 1;

  if v_receivable_account_id is null or v_revenue_account_id is null or v_vat_account_id is null then
    raise exception 'accounts 221, 611 and 5344 must be active before saving a sales invoice';
  end if;

  v_description := format(
    'Vânzarea conform facturii %s către %s',
    new.invoice_number,
    new.counterparty_name
  );

  insert into public.ledger_entries (
    user_id,
    source_document_id,
    source_invoice_id,
    entry_date,
    description,
    status
  ) values (
    new.user_id,
    new.source_document_id,
    new.id,
    new.issue_date,
    v_description,
    'draft'
  ) returning id into v_entry_id;

  insert into public.ledger_lines (
    user_id,
    entry_id,
    account_id,
    line_number,
    description,
    debit,
    credit,
    currency
  ) values (
    new.user_id,
    v_entry_id,
    v_receivable_account_id,
    v_line,
    'Creanța față de cumpărător',
    new.total_amount,
    0,
    new.currency
  );

  if new.subtotal > 0 then
    v_line := v_line + 1;
    insert into public.ledger_lines (user_id, entry_id, account_id, line_number, description, debit, credit, currency)
    values (new.user_id, v_entry_id, v_revenue_account_id, v_line, 'Venitul din vânzări fără TVA', 0, new.subtotal, new.currency);
  end if;

  if new.vat_amount > 0 then
    v_line := v_line + 1;
    insert into public.ledger_lines (user_id, entry_id, account_id, line_number, description, debit, credit, currency)
    values (new.user_id, v_entry_id, v_vat_account_id, v_line, 'TVA aferentă vânzării', 0, new.vat_amount, new.currency);
  end if;

  insert into public.audit_events (user_id, entity_type, entity_id, action, metadata)
  values (
    new.user_id,
    'ledger_entry',
    v_entry_id,
    'created',
    jsonb_build_object('source', 'sales_invoice', 'invoice_id', new.id, 'amount', new.total_amount, 'currency', new.currency)
  );

  return new;
end;
$$;

revoke all on function private.create_sale_invoice_journal_draft() from public;

drop trigger if exists invoices_create_sale_journal_draft on public.invoices;
create trigger invoices_create_sale_journal_draft
after update of subtotal, vat_amount, total_amount on public.invoices
for each row
when (new.direction = 'sale')
execute function private.create_sale_invoice_journal_draft();

comment on function private.create_sale_invoice_journal_draft()
  is 'Creates one balanced draft journal entry for an issued invoice after its totals are calculated.';
