update public.copilot_interactions
set sources = case intent
  when 'period_summary' then jsonb_build_array(
    jsonb_build_object('id', 'summary-registers', 'label', 'Registrul facturilor', 'type', 'invoice', 'href', '/registers'),
    jsonb_build_object('id', 'summary-ledger', 'label', 'Jurnalul operațiunilor', 'type', 'entry', 'href', '/ledger')
  ) || sources
  when 'price_creation' then jsonb_build_array(
    jsonb_build_object('id', 'prices-open', 'label', 'Deschide formarea prețurilor', 'type', 'price', 'href', '/prices')
  ) || sources
  when 'document_review' then jsonb_build_array(
    jsonb_build_object('id', 'documents-open', 'label', 'Registrul documentelor', 'type', 'document', 'href', '/documents')
  ) || sources
  when 'unpaid_supplier_invoices' then jsonb_build_array(
    jsonb_build_object('id', 'supplier-register', 'label', 'Registrul de procurări', 'type', 'invoice', 'href', '/registers')
  ) || sources
  else jsonb_build_array(
    jsonb_build_object('id', 'general-documents', 'label', 'Documente', 'type', 'document', 'href', '/documents'),
    jsonb_build_object('id', 'general-registers', 'label', 'Registre facturi', 'type', 'invoice', 'href', '/registers'),
    jsonb_build_object('id', 'general-ledger', 'label', 'Jurnalul operațiunilor', 'type', 'entry', 'href', '/ledger')
  ) || sources
end;
