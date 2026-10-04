drop function if exists public.create_invoice(public.invoice_direction, text, date, text, text, text, jsonb);

create function public.create_invoice(
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
  v_item jsonb;
  v_line integer := 0;
  v_subtotal numeric(18, 2) := 0;
  v_vat numeric(18, 2) := 0;
  v_line_subtotal numeric(18, 2);
  v_line_vat numeric(18, 2);
  v_quantity numeric(18, 3);
  v_unit_price numeric(18, 4);
  v_vat_rate numeric(5, 2);
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if nullif(trim(p_invoice_number), '') is null or nullif(trim(p_counterparty_name), '') is null then raise exception 'invoice header is incomplete'; end if;
  if p_currency !~ '^[A-Z]{3}$' then raise exception 'invalid currency'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'at least one item is required'; end if;
  if p_source_document_id is not null and not exists (select 1 from public.documents where id = p_source_document_id and user_id = v_user_id) then raise exception 'source document not found'; end if;

  insert into public.invoices (user_id, direction, invoice_number, issue_date, counterparty_name, counterparty_tax_id, currency, source_document_id)
  values (v_user_id, p_direction, trim(p_invoice_number), p_issue_date, trim(p_counterparty_name), nullif(trim(p_counterparty_tax_id), ''), p_currency, p_source_document_id)
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

  update public.invoices set subtotal = v_subtotal, vat_amount = v_vat, total_amount = v_subtotal + v_vat where id = v_invoice_id and user_id = v_user_id;
  if p_source_document_id is not null then update public.documents set status = 'posted' where id = p_source_document_id and user_id = v_user_id; end if;
  return v_invoice_id;
end;
$$;

revoke all on function public.create_invoice(public.invoice_direction, text, date, text, text, text, jsonb, uuid) from public;
grant execute on function public.create_invoice(public.invoice_direction, text, date, text, text, text, jsonb, uuid) to authenticated;
