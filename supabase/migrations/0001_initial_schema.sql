create extension if not exists pgcrypto;

create table if not exists clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text not null,
  city text not null,
  area text,
  address text,
  phone text,
  whatsapp text,
  email text,
  logo_url text,
  description text,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  name text not null,
  description text,
  category text,
  price_min integer,
  price_max integer,
  duration_minutes integer,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  name text not null,
  specialty text,
  bio text,
  consultation_fee integer,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists working_hours (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  open_time time,
  close_time time,
  is_closed boolean default false
);

create table if not exists appointment_requests (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  doctor_id uuid references doctors(id) on delete set null,
  patient_name text not null,
  patient_phone text not null,
  preferred_date date,
  preferred_time text,
  concern_note text,
  source text default 'form',
  status text default 'new',
  staff_notes text,
  created_at timestamptz default now(),
  constraint appointment_requests_status_check check (
    status in ('new', 'contacted', 'confirmed', 'completed', 'cancelled', 'lost')
  )
);

create table if not exists clinic_knowledge (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  title text not null,
  content text not null,
  category text,
  is_active boolean default true,
  updated_at timestamptz default now()
);

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  patient_phone text,
  summary text,
  created_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade,
  clinic_id uuid references clinics(id) on delete cascade,
  role text not null,
  message text not null,
  intent text,
  created_at timestamptz default now()
);

create index if not exists clinics_slug_idx on clinics(slug);
create index if not exists services_clinic_id_idx on services(clinic_id);
create index if not exists doctors_clinic_id_idx on doctors(clinic_id);
create index if not exists appointment_requests_clinic_id_idx on appointment_requests(clinic_id);
create index if not exists appointment_requests_status_idx on appointment_requests(status);
create index if not exists clinic_knowledge_clinic_id_idx on clinic_knowledge(clinic_id);
create index if not exists chat_sessions_clinic_id_idx on chat_sessions(clinic_id);
create index if not exists chat_messages_session_id_idx on chat_messages(session_id);
create index if not exists chat_messages_clinic_id_idx on chat_messages(clinic_id);
