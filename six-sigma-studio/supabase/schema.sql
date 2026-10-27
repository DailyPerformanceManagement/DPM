
-- Six Sigma Studio schema — matches the live Supabase integration.
-- Apply only to a new Supabase environment. Do not replace existing DPM tables.
create table if not exists public.sigma_studio_projects(
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(length(trim(name))>0), objective text not null default '',location text not null default '',
 sponsor text not null default '',leader text not null default '',methodology text not null default 'DMAIC',
 charter jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(id,user_id));
create table if not exists public.sigma_studio_phases(
 id uuid primary key default gen_random_uuid(),project_id uuid not null,user_id uuid not null default auth.uid(),
 phase text not null check(phase in ('Define','Measure','Analyze','Improve','Control')),
 status text not null default 'in_progress' check(status in ('in_progress','completed')),
 conclusion text not null default '',completed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(project_id,user_id,phase),
 foreign key(project_id,user_id) references public.sigma_studio_projects(id,user_id) on delete cascade);
create table if not exists public.sigma_studio_datasets(
 id uuid primary key default gen_random_uuid(),project_id uuid not null,user_id uuid not null default auth.uid(),
 name text not null,description text not null default '',columns jsonb not null default '[]'::jsonb check(jsonb_typeof(columns)='array'),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,project_id,user_id),
 foreign key(project_id,user_id) references public.sigma_studio_projects(id,user_id) on delete cascade);
create table if not exists public.sigma_studio_data_rows(
 id uuid primary key default gen_random_uuid(),dataset_id uuid not null,project_id uuid not null,user_id uuid not null default auth.uid(),
 values jsonb not null default '{}'::jsonb check(jsonb_typeof(values)='object'),created_at timestamptz not null default now(),
 foreign key(dataset_id,project_id,user_id) references public.sigma_studio_datasets(id,project_id,user_id) on delete cascade);
create table if not exists public.sigma_studio_kpis(
 id uuid primary key default gen_random_uuid(),project_id uuid not null,user_id uuid not null default auth.uid(),
 name text not null,category text not null default 'Quality',unit text not null default '',
 direction text not null default 'at_most' check(direction in ('at_most','at_least','range')),
 target_value numeric,target_high numeric,baseline numeric,source text not null default '',
 dataset_id uuid,value_field text not null default '',
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(project_id,user_id) references public.sigma_studio_projects(id,user_id) on delete cascade,
 foreign key(dataset_id,project_id,user_id) references public.sigma_studio_datasets(id,project_id,user_id));
create table if not exists public.sigma_studio_tools(
 id uuid primary key default gen_random_uuid(),project_id uuid not null,user_id uuid not null default auth.uid(),
 phase text not null check(phase in ('Define','Measure','Analyze','Improve','Control')),
 method_key text not null,title text not null,
 status text not null default 'draft' check(status in ('draft','completed')),
 content jsonb not null default '{}'::jsonb check(jsonb_typeof(content)='object'),
 result jsonb not null default '{}'::jsonb,conclusion text not null default '',dataset_id uuid,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(id,project_id,user_id),
 foreign key(project_id,user_id) references public.sigma_studio_projects(id,user_id) on delete cascade,
 foreign key(dataset_id,project_id,user_id) references public.sigma_studio_datasets(id,project_id,user_id));
create table if not exists public.sigma_studio_actions(
 id uuid primary key default gen_random_uuid(),project_id uuid not null,user_id uuid not null default auth.uid(),
 phase text not null default 'Improve',title text not null,owner_name text not null default '',
 due_date date,status text not null default 'todo' check(status in ('todo','doing','done')),
 priority text not null default 'medium',notes text not null default '',tool_id uuid,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(project_id,user_id) references public.sigma_studio_projects(id,user_id) on delete cascade,
 foreign key(tool_id,project_id,user_id) references public.sigma_studio_tools(id,project_id,user_id));
create table if not exists public.sigma_studio_files(
 id uuid primary key default gen_random_uuid(),project_id uuid not null,user_id uuid not null default auth.uid(),
 title text not null,storage_path text not null,mime_type text not null default '',created_at timestamptz not null default now(),
 foreign key(project_id,user_id) references public.sigma_studio_projects(id,user_id) on delete cascade);
create index if not exists sigma_studio_rows_dataset_idx on public.sigma_studio_data_rows(dataset_id);
create index if not exists sigma_studio_tools_project_idx on public.sigma_studio_tools(project_id,phase);
create index if not exists sigma_studio_kpis_project_idx on public.sigma_studio_kpis(project_id);
create index if not exists sigma_studio_actions_project_idx on public.sigma_studio_actions(project_id);
create index if not exists sigma_studio_phases_project_idx on public.sigma_studio_phases(project_id);

create or replace function public.sigma_studio_touched() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.updated_at=now(); return new; end; $$;
do $$ declare t text; begin
foreach t in array array['sigma_studio_projects','sigma_studio_phases','sigma_studio_datasets','sigma_studio_kpis','sigma_studio_tools','sigma_studio_actions'] loop
execute format('drop trigger if exists touched on public.%I',t);
execute format('create trigger touched before update on public.%I for each row execute function public.sigma_studio_touched()',t);
end loop; end $$;
do $$ declare t text; begin
foreach t in array array['sigma_studio_projects','sigma_studio_phases','sigma_studio_datasets','sigma_studio_data_rows','sigma_studio_kpis','sigma_studio_tools','sigma_studio_actions','sigma_studio_files'] loop
execute format('alter table public.%I enable row level security',t);
execute format('drop policy if exists "owner_select" on public.%I',t);
execute format('drop policy if exists "owner_insert" on public.%I',t);
execute format('drop policy if exists "owner_update" on public.%I',t);
execute format('drop policy if exists "owner_delete" on public.%I',t);
execute format('create policy "owner_select" on public.%I for select to authenticated using (user_id=(select auth.uid()))',t);
execute format('create policy "owner_insert" on public.%I for insert to authenticated with check (user_id=(select auth.uid()))',t);
execute format('create policy "owner_update" on public.%I for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()))',t);
execute format('create policy "owner_delete" on public.%I for delete to authenticated using (user_id=(select auth.uid()))',t);
execute format('revoke all on public.%I from anon',t);
execute format('grant select,insert,update,delete on public.%I to authenticated',t);
end loop; end $$;
insert into storage.buckets(id,name,public,file_size_limit)
values ('sigma-studio','sigma-studio',false,10485760) on conflict(id) do nothing;
create policy "sigma_storage_read" on storage.objects for select to authenticated
using (bucket_id='sigma-studio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "sigma_storage_add" on storage.objects for insert to authenticated
with check (bucket_id='sigma-studio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "sigma_storage_remove" on storage.objects for delete to authenticated
using (bucket_id='sigma-studio' and (storage.foldername(name))[1]=(select auth.uid())::text);
