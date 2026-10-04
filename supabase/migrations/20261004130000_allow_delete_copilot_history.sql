create policy copilot_interactions_delete_own
  on public.copilot_interactions for delete to authenticated
  using (auth.uid() = user_id);

grant delete on table public.copilot_interactions to authenticated;
