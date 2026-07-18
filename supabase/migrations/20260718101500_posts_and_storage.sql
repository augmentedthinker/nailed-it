create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_path text unique not null,
  caption text check (char_length(caption) <= 500),
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;
create policy "Members can view posts" on public.posts for select to authenticated using (true);
create policy "Members create their own posts" on public.posts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Members delete their own posts" on public.posts for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nail-posts', 'nail-posts', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do nothing;

create policy "Members can view nail photos" on storage.objects for select to authenticated using (bucket_id = 'nail-posts');
create policy "Members upload to their folder" on storage.objects for insert to authenticated with check (bucket_id = 'nail-posts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Members delete from their folder" on storage.objects for delete to authenticated using (bucket_id = 'nail-posts' and (storage.foldername(name))[1] = (select auth.uid())::text);
