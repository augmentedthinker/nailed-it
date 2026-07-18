create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
create policy "Members view their own push devices" on public.push_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Members register their own push devices" on public.push_subscriptions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Members update their own push devices" on public.push_subscriptions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Members remove their own push devices" on public.push_subscriptions for delete to authenticated using ((select auth.uid()) = user_id);
