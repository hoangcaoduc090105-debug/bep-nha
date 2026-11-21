-- NOT USED. Reference only: the app stores data on the device (IndexedDB), see DATABASE_SCHEMA.md.
-- Kept in case a cloud database is ever wanted.
-- BẾP NHÀ — initial database design (PostgreSQL / Supabase)
-- Status: PROPOSAL for review. Becomes supabase/migrations/0001_init.sql once approved.
-- Revision 3 (2026-11-21): single-account model. No households, no members, no roles.
-- Conventions: uuid keys, timestamptz in UTC. Every top-level table carries
--   owner_id uuid not null default auth.uid()
-- which is filled in by the database, never by the app. Row level security on every table
-- (bottom of file) lets a signed-in account touch only its own rows. If more people are ever
-- added, owner_id is the single place to change (point it at a shared group instead).

create extension if not exists pgcrypto;
create extension if not exists unaccent;   -- search without diacritics ("ca kho" finds "cá kho")
create extension if not exists pg_trgm;    -- typo-tolerant search

-- ───────────────────────────── Settings ─────────────────────────────

-- One row per account: everything "Cài đặt" stores, so settings follow the account across devices.
create table app_settings (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  kitchen_name text not null default 'Bếp Nhà',
  address_as text not null default 'mẹ',          -- how the app addresses the cook in greetings and speech
  text_scale text not null default 'lon' check (text_scale in ('lon','rat_lon','cuc_lon')),
  voice_enabled boolean not null default true,
  voice_rate numeric(3,2) not null default 0.90 check (voice_rate between 0.5 and 1.5),
  auto_read_steps boolean not null default false,
  default_servings int not null default 4 check (default_servings between 1 and 30),
  -- household measuring tools, in ml. Approximate by nature; the family can calibrate.
  teaspoon_ml numeric(5,1) not null default 5   check (teaspoon_ml between 2 and 10),
  tablespoon_ml numeric(5,1) not null default 15 check (tablespoon_ml between 8 and 25),
  bowl_ml numeric(5,1) not null default 250      check (bowl_ml between 100 and 500), -- "chén"
  last_backup_at timestamptz,                     -- drives the "đã lâu chưa sao lưu" reminder
  updated_at timestamptz not null default now()
);

-- ───────────────────────────── Catalogues ─────────────────────────────

create table categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,                       -- "Món kho", "Món canh"...
  kind text not null default 'dish_type' check (kind in ('dish_type','meal','method')),
  sort_order int not null default 0,
  unique (owner_id, name)
);

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,                       -- "Nước mắm", "Thịt ba chỉ"
  search_name text generated always as (lower(unaccent(name))) stored,
  kind text not null default 'food' check (kind in ('food','seasoning')),
  shop_section text,                        -- "Thịt cá", "Rau củ", "Gia vị" — groups the shopping list
  grams_per_ml numeric(5,2) check (grams_per_ml > 0), -- density, to convert spoons to grams; null = unknown
  taste_role text check (taste_role in ('sweet','salty','spicy','sour','rich')),
  unique (owner_id, name)
);
create index on ingredients using gin (search_name gin_trgm_ops);

create table equipment (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,                       -- "Bếp gas", "Nồi chiên không dầu", "Thớt"
  kind text not null check (kind in ('appliance','utensil')),
  is_owned boolean not null default true,   -- does this kitchen have it? drives the equipment filter
  unique (owner_id, name)
);

-- ───────────────────────────── Recipes & versions ─────────────────────────────

create table recipe_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('youtube','website','book','family','sample')),
  title text not null,                      -- video title or "Công thức của bà ngoại"
  creator_name text,                        -- channel name, as verified
  url text check (url is null or url ~ '^https://'),
  youtube_video_id text check (youtube_video_id is null or youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  -- honest labelling of how the written recipe relates to the source
  fidelity text not null default 'inspired' check (fidelity in ('exact','transcribed','inspired','own')),
  note text,
  created_at timestamptz not null default now()
);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  search_name text generated always as (lower(unaccent(name))) stored,
  description text,
  image_path text,                          -- Supabase Storage path; null = show the "no photo yet" tile
  image_credit text,                        -- who took it / licence
  source_id uuid references recipe_sources(id) on delete set null,
  difficulty text not null default 'easy' check (difficulty in ('easy','medium','hard')),
  original_version_id uuid,                 -- FK added below (circular)
  family_version_id uuid,                   -- the preferred family version; null = cook the original
  verification text not null default 'sample'
    check (verification in ('sample','source_checked','family_approved')),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on recipes (owner_id, is_archived);
create index on recipes using gin (search_name gin_trgm_ops);

create table recipe_categories (
  recipe_id uuid not null references recipes(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (recipe_id, category_id)
);
create index on recipe_categories (category_id);

-- A version is a complete, self-contained snapshot: its own ingredients and steps.
-- Versions are never edited once a cooking session points at them (trigger below);
-- changing a recipe means writing a new version.
create table recipe_versions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('original','family')),
  version_no int not null,                  -- 1, 2, 3… per recipe
  label text,                               -- "Bản ít ngọt", "Bản nấu Tết"
  parent_version_id uuid references recipe_versions(id) on delete set null,
  change_reason text,                       -- "Lần trước hơi mặn, bớt nước mắm"
  from_session_id uuid,                     -- the cooking session that produced it, if any
  servings int not null check (servings between 1 and 30),
  prep_minutes int not null default 0 check (prep_minutes between 0 and 1440),
  cook_minutes int not null default 0 check (cook_minutes between 0 and 1440),
  notes text,                               -- important cooking notes
  taste_tips text,                          -- how to correct: too salty / too sweet…
  created_at timestamptz not null default now(),
  unique (recipe_id, version_no)
);
create index on recipe_versions (recipe_id, kind);

alter table recipes
  add constraint recipes_original_fk foreign key (original_version_id)
    references recipe_versions(id) on delete set null,
  add constraint recipes_family_fk foreign key (family_version_id)
    references recipe_versions(id) on delete set null;

create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references recipe_versions(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  slot text not null,                       -- stable key inside the recipe, e.g. "nuoc_mam"; steps refer to it
  group_name text not null default 'Nguyên liệu',  -- "Nguyên liệu" | "Gia vị" | "Nước chấm"
  sort_order int not null default 0,
  -- household measure (what mother reads first)
  quantity numeric(8,2) check (quantity > 0),
  unit text check (unit in ('g','kg','ml','l','muong_ca_phe','muong_canh','chen',
                            'trai','cu','tep','nhanh','cay','la','lat','con','qua','mieng','bo','it')),
  -- standardised measure, shown alongside
  metric_quantity numeric(8,1) check (metric_quantity > 0),
  metric_unit text check (metric_unit in ('g','ml')),
  is_approximate boolean not null default false,  -- shows "khoảng"
  is_optional boolean not null default false,
  scales_with_servings boolean not null default true,
  prep_note text,                           -- "cắt khúc 3 cm", "băm nhỏ"
  constraint qty_or_free_text check (quantity is not null or unit = 'it' or prep_note is not null),
  unique (version_id, slot)
);
create index on recipe_ingredients (version_id, sort_order);
create index on recipe_ingredients (ingredient_id);   -- "what can I cook with…"

create table cooking_steps (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references recipe_versions(id) on delete cascade,
  step_no int not null check (step_no >= 1),
  phase text not null default 'cook' check (phase in ('prep','cook','finish')),
  title text not null,                      -- "Phi thơm hành và tỏi"
  -- Sub-instructions. Quantities are written as {slot} tokens ("Cho {nuoc_mam} vào nồi") and
  -- rendered from recipe_ingredients, so text, list and scaling can never disagree.
  instructions jsonb not null check (jsonb_typeof(instructions) = 'array'),
  done_when text,                           -- what to see / smell / hear: "hành vàng nhạt, dậy mùi thơm"
  avoid text,                               -- common mistake: "lửa lớn làm tỏi cháy, đắng"
  if_wrong text,                            -- troubleshooting
  timer_seconds int check (timer_seconds between 5 and 21600),
  timer_label text,
  heat text check (heat in ('low','medium','high','off')),
  image_path text,
  video_start_seconds int check (video_start_seconds >= 0),
  unique (version_id, step_no)
);

-- Which ingredients go in at which step (drives the big quantity display in cooking mode
-- and "Tôi đã cho nước mắm rồi").
create table step_ingredients (
  step_id uuid not null references cooking_steps(id) on delete cascade,
  recipe_ingredient_id uuid not null references recipe_ingredients(id) on delete cascade,
  portion numeric(4,3) not null default 1 check (portion > 0 and portion <= 1), -- 0.5 = half now
  primary key (step_id, recipe_ingredient_id)
);

create table recipe_equipment (
  version_id uuid not null references recipe_versions(id) on delete cascade,
  equipment_id uuid not null references equipment(id) on delete restrict,
  is_required boolean not null default true,
  alternative_note text,                    -- only filled when a substitution is genuinely sound
  primary key (version_id, equipment_id)
);
create index on recipe_equipment (equipment_id);

-- ───────────────────────────── Taste profile ─────────────────────────────

create table family_taste_profile (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  sweetness smallint not null default 3 check (sweetness between 1 and 5),
  saltiness smallint not null default 3 check (saltiness between 1 and 5),
  spiciness smallint not null default 2 check (spiciness between 1 and 5),
  sourness smallint not null default 3 check (sourness between 1 and 5),
  richness smallint not null default 3 check (richness between 1 and 5),
  regional_style text not null default 'southern',
  notes text,
  updated_at timestamptz not null default now()
);
-- The profile only produces *suggestions* on recipes with no family version. It never rewrites a recipe.

-- ───────────────────────────── Cooking sessions & journal ─────────────────────────────

create table cooking_sessions (
  id uuid primary key default gen_random_uuid(),   -- generated on the phone, so retries are idempotent
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete restrict,
  recipe_version_id uuid not null references recipe_versions(id) on delete restrict, -- the exact version cooked
  servings_cooked int not null check (servings_cooked between 1 and 30),
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  current_step_no int not null default 1,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint finished_after_started check (finished_at is null or finished_at >= started_at),
  constraint completed_has_end check (status <> 'completed' or finished_at is not null)
);
create index on cooking_sessions (owner_id, started_at desc);
create index on cooking_sessions (recipe_id, started_at desc);

alter table recipe_versions
  add constraint versions_from_session_fk foreign key (from_session_id)
    references cooking_sessions(id) on delete set null;

-- What was actually used when it differed from the version ("hôm nay cho 1 muỗng thôi").
create table cooking_adjustments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references cooking_sessions(id) on delete cascade,
  recipe_ingredient_id uuid not null references recipe_ingredients(id) on delete restrict,
  planned_quantity numeric(8,2),
  actual_quantity numeric(8,2) check (actual_quantity >= 0),
  unit text,
  note text,
  unique (session_id, recipe_ingredient_id)
);

create table cooking_feedback (
  session_id uuid primary key references cooking_sessions(id) on delete cascade,
  verdict text not null check (verdict in ('rat_ngon','vua_mieng','chua_ngon')),
  -- taste flags, several allowed: {"hoi_man","hoi_ngot","hoi_nhat","hoi_cay","hoi_chua","hoi_beo"}
  taste_flags text[] not null default '{}',
  note text,
  created_at timestamptz not null default now()
);

create table session_photos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references cooking_sessions(id) on delete cascade,
  image_path text not null,
  created_at timestamptz not null default now()
);
create index on session_photos (session_id);

create table favorite_recipes (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, recipe_id)
);

-- Ingredients currently at home ("Nhà đang có gì?").
create table pantry_items (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (owner_id, ingredient_id)
);

-- ───────────────────────────── Planner & shopping (P2) ─────────────────────────────

create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_date date not null,
  meal text not null default 'dinner' check (meal in ('breakfast','lunch','dinner')),
  recipe_id uuid not null references recipes(id) on delete cascade,
  servings int check (servings between 1 and 30),
  unique (owner_id, plan_date, meal, recipe_id)
);
create index on meal_plans (owner_id, plan_date);

create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  week_start date,
  created_at timestamptz not null default now()
);

create table shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references shopping_lists(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete set null,
  label text not null,                      -- free text allowed ("giấy bạc")
  quantity numeric(8,2),
  unit text,
  is_checked boolean not null default false,
  sort_order int not null default 0
);
create index on shopping_list_items (list_id);

-- ───────────────────────────── Integrity triggers ─────────────────────────────

-- A version that has been cooked is frozen. History must keep meaning what it meant.
create or replace function forbid_change_to_cooked_version() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from cooking_sessions s where s.recipe_version_id = old.id) then
    raise exception 'Version % has been cooked and cannot be changed. Save a new version instead.', old.id;
  end if;
  return coalesce(new, old);
end $$;

create or replace function forbid_change_to_cooked_version_part() returns trigger
language plpgsql as $$
declare v uuid;
begin
  if tg_op = 'INSERT' then v := new.version_id; else v := old.version_id; end if;
  if exists (select 1 from cooking_sessions s where s.recipe_version_id = v) then
    raise exception 'Version % has been cooked and cannot be changed. Save a new version instead.', v;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create trigger freeze_version before update or delete on recipe_versions
  for each row execute function forbid_change_to_cooked_version();
create trigger freeze_ingredients before insert or update or delete on recipe_ingredients
  for each row execute function forbid_change_to_cooked_version_part();
create trigger freeze_steps before insert or update or delete on cooking_steps
  for each row execute function forbid_change_to_cooked_version_part();
-- Not yet run against a database. Each trigger gets a database test in the first migration.

-- The original version is never deleted, and family_version_id must belong to the same recipe.
create or replace function check_recipe_version_pointers() returns trigger
language plpgsql as $$
begin
  if new.family_version_id is not null and not exists (
    select 1 from recipe_versions v where v.id = new.family_version_id and v.recipe_id = new.id) then
    raise exception 'family_version_id must point at a version of the same recipe';
  end if;
  if new.original_version_id is not null and not exists (
    select 1 from recipe_versions v
    where v.id = new.original_version_id and v.recipe_id = new.id and v.kind = 'original') then
    raise exception 'original_version_id must point at an original version of the same recipe';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger recipe_pointers before update on recipes
  for each row execute function check_recipe_version_pointers();

-- ───────────────────────────── Row level security ─────────────────────────────
-- One rule everywhere: a signed-in account sees and changes only rows it owns.
-- No roles, no admin check. Anonymous requests get nothing. Even if a second account were
-- ever created by mistake, it would see an empty app, not this family's data.

do $$
declare t text;
begin
  -- tables that carry owner_id
  foreach t in array array[
    'app_settings','categories','ingredients','equipment','recipe_sources','recipes',
    'recipe_versions','family_taste_profile','cooking_sessions','favorite_recipes',
    'pantry_items','meal_plans','shopping_lists']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format(
      'create policy %I on %I for all to authenticated
         using (owner_id = (select auth.uid()))
         with check (owner_id = (select auth.uid()))', t || '_owner', t);
  end loop;
end $$;

-- Child tables have no owner_id; they inherit access from their parent row.
-- Written out per table in the migration, in this shape:
--   alter table recipe_ingredients enable row level security;
--   create policy recipe_ingredients_owner on recipe_ingredients for all to authenticated
--     using (exists (select 1 from recipe_versions v
--                    where v.id = version_id and v.owner_id = (select auth.uid())))
--     with check (exists (select 1 from recipe_versions v
--                    where v.id = version_id and v.owner_id = (select auth.uid())));
-- parent of each child table:
--   recipe_categories    -> recipes            recipe_ingredients -> recipe_versions
--   cooking_steps        -> recipe_versions    step_ingredients   -> cooking_steps -> recipe_versions
--   recipe_equipment     -> recipe_versions    cooking_adjustments-> cooking_sessions
--   cooking_feedback     -> cooking_sessions   session_photos     -> cooking_sessions
--   shopping_list_items  -> shopping_lists

-- Storage: two PRIVATE buckets, "recipe-images" and "session-photos".
-- Object path = <auth.uid()>/<recipe or session id>/<file>. Policy on storage.objects:
--   for all to authenticated
--   using (bucket_id in ('recipe-images','session-photos')
--          and (storage.foldername(name))[1] = (select auth.uid())::text)
-- Images are shown through short-lived signed URLs.

-- Auth settings (Supabase dashboard, not SQL): public sign-up OFF; the single account is
-- created by hand in the dashboard. The service-role key is never used by the app.
