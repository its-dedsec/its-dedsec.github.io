
-- Create user_api_keys table for storing encrypted API keys
create table if not exists public.user_api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  api_keys jsonb not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Enable RLS
alter table public.user_api_keys enable row level security;

-- Create policies
create policy "Users can view their own API keys" on public.user_api_keys
  for select using (auth.uid() = user_id);

create policy "Users can insert their own API keys" on public.user_api_keys
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own API keys" on public.user_api_keys
  for update using (auth.uid() = user_id);

create policy "Users can delete their own API keys" on public.user_api_keys
  for delete using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_user_api_keys_updated_at
  before update on public.user_api_keys
  for each row execute function public.handle_updated_at();
