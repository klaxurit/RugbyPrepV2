create table public.cancel_feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  reason text not null,
  detail text,
  created_at timestamptz default now()
);

alter table public.cancel_feedback enable row level security;

-- Users can insert their own feedback
create policy "Users insert own feedback"
  on public.cancel_feedback for insert
  with check (auth.uid() = user_id);

-- Only service role can read (admin dashboard)
create policy "Service role reads all feedback"
  on public.cancel_feedback for select
  using (auth.role() = 'service_role');
