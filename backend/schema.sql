-- Base de trabajo para Supabase. Revisar en entorno de pruebas antes de producción.
-- No se ejecuta ni configura ningún servicio desde la demo publicada.
create table public.client_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);
create table public.credit_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_reference text not null,
  profile jsonb not null default '{}'::jsonb,
  quotation jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check(status in ('draft','submitted','review','documents_pending','lender_review','closed')),
  privacy_notice_version text,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.credit_applications(id) on delete cascade,
  document_type text not null,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);
-- Document metadata/status transitions are written by a trusted server only.
-- The server must independently verify user membership before using service_role.
alter table public.client_profiles enable row level security;
alter table public.credit_applications enable row level security;
alter table public.application_documents enable row level security;
revoke all on public.client_profiles, public.credit_applications, public.application_documents from anon, authenticated;
grant select, insert, update on public.client_profiles to authenticated;
grant select on public.credit_applications, public.application_documents to authenticated;
grant insert (user_id,vehicle_reference,profile,quotation) on public.credit_applications to authenticated;
grant update (profile) on public.credit_applications to authenticated;
create policy own_profile_read on public.client_profiles for select to authenticated using ((select auth.uid())=user_id);
create policy own_profile_create on public.client_profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy own_profile_update on public.client_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy own_application_read on public.credit_applications for select to authenticated using ((select auth.uid())=user_id);
create policy own_application_create on public.credit_applications for insert to authenticated with check ((select auth.uid())=user_id and status='draft');
create policy own_draft_edit on public.credit_applications for update to authenticated using ((select auth.uid())=user_id and status='draft') with check ((select auth.uid())=user_id and status='draft');
create policy own_document_read on public.application_documents for select to authenticated using (exists(select 1 from public.credit_applications a where a.id=application_id and a.user_id=(select auth.uid())));
create index credit_applications_user_id_idx on public.credit_applications(user_id);
create index application_documents_application_id_idx on public.application_documents(application_id);
-- Storage policies, staff authorization, audit trails, consent handling,
-- server validation and notification queues must be implemented before launch.
-- Never expose service_role or OAuth secrets in static JS / GitHub Pages.

-- ===== Ampliación para el sitio completo (inventario, citas, venta, prospectos, favoritos, alertas) =====
-- Borrador: revisar en entorno de pruebas. Las escrituras públicas (citas, preofertas, prospectos)
-- deben pasar por un endpoint del servidor con validación y anti-spam, no directo desde el navegador.
create table public.vehicles (
  id text primary key,
  folio text not null unique,
  marca text not null, modelo text not null, version text,
  year int not null check (year between 1950 and 2100),
  km int not null check (km >= 0),
  price numeric(12,2) not null check (price > 0),
  tipo text not null check (tipo in ('SUV','Sedán','Pick Up','Hatchback')),
  trans text, fuel text, cil int, owners int, keys int,
  sucursal text not null,
  tags text[] not null default '{}',
  separado boolean not null default false,
  garantia_dias int not null default 0,
  state text not null default 'Disponible' check (state in ('Disponible','Vendido','Oculto')),
  description text,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text not null references public.vehicles(id) on delete cascade,
  storage_path text not null, position int not null default 0
);
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  vehicle_id text references public.vehicles(id) on delete set null,
  branch text not null, payment text not null,
  starts_at timestamptz not null,
  name text not null, phone text not null, email text,
  status text not null default 'Pendiente' check (status in ('Pendiente','Confirmada','Atendida','Cancelada')),
  created_at timestamptz not null default now(),
  unique (branch, starts_at)
);
create table public.trade_in_offers (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  marca text not null, modelo text not null, version text, year int not null, km int not null,
  name text not null, phone text not null, email text, branch text,
  estimate_low numeric(12,2), estimate_high numeric(12,2),
  target_vehicle_id text references public.vehicles(id) on delete set null,
  status text not null default 'Nueva',
  created_at timestamptz not null default now()
);
create table public.credit_leads (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  name text not null, email text not null, phone text not null,
  vehicle_id text references public.vehicles(id) on delete set null,
  privacy_notice_version text, consent_at timestamptz,
  status text not null default 'Nuevo',
  created_at timestamptz not null default now()
);
create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id text not null references public.vehicles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vehicle_id)
);
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('precio','busqueda')),
  vehicle_id text references public.vehicles(id) on delete cascade,
  price_at_creation numeric(12,2),
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.vehicles enable row level security;
alter table public.vehicle_photos enable row level security;
alter table public.appointments enable row level security;
alter table public.trade_in_offers enable row level security;
alter table public.credit_leads enable row level security;
alter table public.favorites enable row level security;
alter table public.alerts enable row level security;
create policy public_vehicles_read on public.vehicles for select to anon, authenticated using (state <> 'Oculto');
create policy public_photos_read on public.vehicle_photos for select to anon, authenticated using (exists(select 1 from public.vehicles v where v.id = vehicle_id and v.state <> 'Oculto'));
create policy own_favorites on public.favorites for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_alerts on public.alerts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_appointments_read on public.appointments for select to authenticated using ((select auth.uid()) = user_id);
create policy own_offers_read on public.trade_in_offers for select to authenticated using ((select auth.uid()) = user_id);
-- Escritura de vehicles/photos y lectura total de citas, preofertas y prospectos: solo personal autorizado (rol de staff verificado en servidor).
