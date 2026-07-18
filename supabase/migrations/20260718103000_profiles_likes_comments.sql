create table public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.likes enable row level security;
alter table public.comments enable row level security;
create policy "Members can view likes" on public.likes for select to authenticated using (true);
create policy "Members like as themselves" on public.likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Members remove their own likes" on public.likes for delete to authenticated using ((select auth.uid()) = user_id);
create policy "Members can view comments" on public.comments for select to authenticated using (true);
create policy "Members comment as themselves" on public.comments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Members remove their own comments" on public.comments for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do nothing;

create policy "Members can view avatars" on storage.objects for select to authenticated using (bucket_id = 'avatars');
create policy "Members upload their avatar" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Members update their avatar" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Members delete their avatar" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
