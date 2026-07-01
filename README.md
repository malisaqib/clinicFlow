# ClinicFlow

ClinicFlow is an AI receptionist and lead management system for aesthetic, dental, and skin clinics in Pakistan.

## Problem

Clinics lose potential patients when routine questions are answered late, appointment requests are scattered across phone and chat channels, and staff have no simple way to track follow-ups.

## Solution

ClinicFlow gives each clinic a public booking page, stores appointment requests in Supabase, gives clinic staff a dashboard for lead status, and provides a safe AI receptionist for routine clinic information.

ClinicFlow is not an AI doctor. It must not diagnose, prescribe medicine, suggest dosage, or decide treatment.

## Features

- Public clinic pages loaded by slug.
- Clinic services, doctors, timings, and knowledge base.
- Appointment request form.
- Appointment request storage with manual staff confirmation.
- Clinic dashboard for lead status tracking.
- Admin onboarding for clinic setup.
- AI receptionist for routine clinic information only.
- Demo seed data for aesthetic and dental clinics.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres
- Supabase Auth, planned
- LLM provider, planned

## Project Status

7-day MVP in progress.

Current foundation includes planning docs, coding agent rules, Supabase schema, and demo seed data. The full app has not been built yet.

## Local Setup

1. Clone the repository.
2. Install dependencies after the Next.js app is scaffolded.
3. Copy `.env.example` to `.env.local`.
4. Fill in Supabase and LLM environment variables.
5. Run the Supabase migration and seed files.
6. Start the local development server after the app is scaffolded.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# LLM provider
LLM_API_KEY=
LLM_MODEL=

# Optional later
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

## Supabase Schema Setup

Run the migration first:

```sql
supabase/migrations/0001_initial_schema.sql
```

Then run the seed data:

```sql
supabase/seed.sql
```

The migration creates:

- `clinics`
- `services`
- `doctors`
- `working_hours`
- `appointment_requests`
- `clinic_knowledge`
- `chat_sessions`
- `chat_messages`

The seed file creates two demo clinics and their related services, doctors, working hours, and knowledge base entries.

## Demo Clinics

- GlowSkin Aesthetic Clinic: `glowskin-demo`
- SmileCare Dental Clinic: `smilecare-demo`

Demo clinic details are documented in `docs/demo-clinics.md`.

## Safety Note

ClinicFlow does not provide medical advice.

The AI receptionist may answer clinic information such as services, timings, location, fees if available, and appointment process. It must hand off diagnosis, medication, dosage, treatment suitability, side effects, emergencies, and other medical concerns to clinic staff or a qualified clinician.

## Team Workflow

- `main` is stable and demo-ready.
- `dev` is active development.
- `feature/*` branches are used for individual tasks.
- No direct commits to `main` after the initial foundation commit.
- Pull requests should be small, focused, and easy to review.

See `docs/git-workflow.md` for the detailed workflow.
