-- Cover every composite foreign key used by the single-user data model.
create index accounts_parent_user_idx
on public.accounts(parent_id, user_id);

create index document_extractions_document_user_idx
on public.document_extractions(document_id, user_id);

create index ledger_entries_source_document_user_idx
on public.ledger_entries(source_document_id, user_id);

create index ledger_lines_account_user_idx
on public.ledger_lines(account_id, user_id);

create index ledger_lines_entry_user_idx
on public.ledger_lines(entry_id, user_id);
