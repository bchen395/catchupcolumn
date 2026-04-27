-- ============================================================
-- 001_initial_schema.sql
-- Initial database schema for Catch Up Column
-- ============================================================

-- --------------------------------------------------------

-- --------------------------------------------------------
-- Tables
-- --------------------------------------------------------

-- users (mirrors auth.users, auto-populated via trigger)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text check (char_length(bio) <= 200),
  email text not null,
  created_at timestamptz not null default now()
);

-- columns (group newsletters)
create table public.columns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_image_url text,
  publish_day int not null default 0 check (publish_day between 0 and 6),
  publish_time time not null default '09:00',
  created_by uuid not null references public.users(id) on delete cascade,
  invite_code text unique not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  created_at timestamptz not null default now()
);

-- column_members (join table)
create table public.column_members (
  column_id uuid not null references public.columns(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('moderator', 'contributor')),
  joined_at timestamptz not null default now(),
  primary key (column_id, user_id)
);

-- posts (individual entries by contributors)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.columns(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  image_url text,
  edition_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- editions (compiled weekly newsletters)
create table public.editions (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.columns(id) on delete cascade,
  edition_number int not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (column_id, edition_number)
);

-- Add the FK from posts.edition_id → editions.id now that both tables exist
alter table public.posts
  add constraint posts_edition_id_fkey
  foreign key (edition_id) references public.editions(id) on delete set null;

-- --------------------------------------------------------
-- Indexes
-- --------------------------------------------------------
create index idx_columns_invite_code on public.columns(invite_code);
create index idx_column_members_user_id on public.column_members(user_id);
create index idx_posts_column_id on public.posts(column_id);
create index idx_posts_edition_id on public.posts(edition_id);
create index idx_editions_column_id on public.editions(column_id);

-- --------------------------------------------------------
-- Helper: check if a user is a member of a column
-- --------------------------------------------------------
create or replace function public.is_column_member(p_column_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.column_members
    where column_id = p_column_id and user_id = p_user_id
  );
$$;

-- Helper: check if a user is a moderator of a column
create or replace function public.is_column_moderator(p_column_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.column_members
    where column_id = p_column_id and user_id = p_user_id and role = 'moderator'
  );
$$;

-- --------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------

-- users
alter table public.users enable row level security;

create policy "Users can read any profile"
  on public.users for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users can insert their own profile"
  on public.users for insert
  to authenticated
  with check (id = auth.uid());

-- columns
alter table public.columns enable row level security;

create policy "Members can read their columns"
  on public.columns for select
  to authenticated
  using (public.is_column_member(id, auth.uid()));

create policy "Authenticated users can create columns"
  on public.columns for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Only moderators can update column settings"
  on public.columns for update
  to authenticated
  using (public.is_column_moderator(id, auth.uid()))
  with check (public.is_column_moderator(id, auth.uid()));

create policy "Only moderators can delete columns"
  on public.columns for delete
  to authenticated
  using (public.is_column_moderator(id, auth.uid()));

-- column_members
alter table public.column_members enable row level security;

create policy "Members can see who is in their column"
  on public.column_members for select
  to authenticated
  using (public.is_column_member(column_id, auth.uid()));

create policy "Users can join a column"
  on public.column_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can leave a column"
  on public.column_members for delete
  to authenticated
  using (user_id = auth.uid());

create policy "Moderators can manage members"
  on public.column_members for update
  to authenticated
  using (public.is_column_moderator(column_id, auth.uid()))
  with check (public.is_column_moderator(column_id, auth.uid()));

-- posts
alter table public.posts enable row level security;

create policy "Members can read posts in their columns"
  on public.posts for select
  to authenticated
  using (public.is_column_member(column_id, auth.uid()));

create policy "Members can create posts in their columns"
  on public.posts for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and public.is_column_member(column_id, auth.uid())
  );

create policy "Users can update their own posts"
  on public.posts for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "Users can delete their own posts"
  on public.posts for delete
  to authenticated
  using (author_id = auth.uid());

-- editions
alter table public.editions enable row level security;

create policy "Members can read editions in their columns"
  on public.editions for select
  to authenticated
  using (public.is_column_member(column_id, auth.uid()));

create policy "Moderators can create editions"
  on public.editions for insert
  to authenticated
  with check (public.is_column_moderator(column_id, auth.uid()));

-- --------------------------------------------------------
-- Auto-updated_at trigger for posts
-- --------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_updated_at
  before update on public.posts
  for each row
  execute function public.handle_updated_at();

-- --------------------------------------------------------
-- Auto-create users row on auth signup
-- --------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- --------------------------------------------------------
-- Auto-add column creator as moderator
-- --------------------------------------------------------
create or replace function public.handle_new_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.column_members (column_id, user_id, role)
  values (new.id, new.created_by, 'moderator');
  return new;
end;
$$;

create trigger on_column_created
  after insert on public.columns
  for each row
  execute function public.handle_new_column();

-- --------------------------------------------------------
-- Storage buckets
-- --------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('post-images', 'post-images', false);

-- avatars: anyone can read, authenticated users can upload their own
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- post-images: only column members can read, members can upload
create policy "Column members can read post images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'post-images'
  );

create policy "Authenticated users can upload post images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own post images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own post images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
