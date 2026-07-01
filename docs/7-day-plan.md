# 7-Day MVP Plan

## Day 1: Planning, Repo, Supabase Schema, Demo Data

- Finalize product planning.
- Add coding agent rules.
- Add README and workflow docs.
- Create Supabase schema migration.
- Add seed data for GlowSkin Aesthetic Clinic and SmileCare Dental Clinic.

## Day 2: Public Clinic Page

- Scaffold the Next.js App Router project if not already present.
- Build `/clinics/[slug]`.
- Load clinic data from Supabase by slug.
- Show services, doctors, timings, address, contact information, and clinic description.
- Make the page usable on mobile.

## Day 3: Appointment Request Form and Saving

- Build appointment form on the public clinic page.
- Capture patient name, phone, preferred date, preferred time, service, doctor, and concern note.
- Save appointment requests to Supabase.
- Store status as `new`.
- Show confirmation copy that staff will contact the patient manually.

## Day 4: Clinic Dashboard and Lead Status

- Build dashboard route for clinic staff.
- Show appointment request list by `clinic_id`.
- Add lead status filters.
- Allow status updates: `new`, `contacted`, `confirmed`, `completed`, `cancelled`, `lost`.
- Add staff notes.

## Day 5: Admin Onboarding Screens

- Build admin screens for clinic setup.
- Add or edit clinic profile information.
- Add or edit services.
- Add or edit doctors.
- Add or edit working hours.
- Add or edit clinic knowledge base entries.

## Day 6: AI Receptionist

- Build patient-facing chat interface.
- Load active clinic knowledge by `clinic_id`.
- Save chat sessions and chat messages.
- Answer routine questions about clinic info, services, timings, location, fees if provided, and appointment process.
- Hand off diagnosis, medication, dosage, symptoms, emergencies, and treatment decisions to clinic staff.

## Day 7: Polish, Deploy, Demo Video, Outreach List

- Improve patient page and dashboard UI.
- Confirm mobile behavior.
- Deploy the MVP.
- Record a short demo video.
- Prepare outreach list for clinics in Islamabad.
- Prepare a sales demo script using both demo clinics.

## Demo Readiness Checklist

- [ ] Public clinic page works for `glowskin-demo`.
- [ ] Public clinic page works for `smilecare-demo`.
- [ ] Appointment request form saves to Supabase.
- [ ] Clinic dashboard shows new leads.
- [ ] Staff can update lead status.
- [ ] AI receptionist refuses medical advice and hands off safely.
- [ ] README setup steps are current.
- [ ] Demo seed data can be re-run safely for demo slugs.
