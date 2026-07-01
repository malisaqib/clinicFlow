# ClinicFlow Planning

## Product One-Liner

ClinicFlow is an AI receptionist and lead management system for aesthetic, dental, and skin clinics in Pakistan.

## Target Customer

Small to mid-sized aesthetic, dental, dermatology, and skin clinics in Pakistan that receive patient inquiries through phone, WhatsApp, Instagram, and walk-ins, but do not have a reliable system for answering routine questions or tracking appointment leads.

## Problem

Clinics lose potential patients because routine questions are answered slowly, appointment requests are scattered across channels, and staff have no simple dashboard for tracking follow-ups.

Common issues:

- Patients ask the same questions about services, fees, timings, location, and booking steps.
- Reception staff manually copy leads from chats into notebooks or spreadsheets.
- Clinics miss follow-ups when messages are busy or after hours.
- Owners cannot easily see how many leads are new, contacted, confirmed, or lost.

## What ClinicFlow Does

ClinicFlow helps clinics:

- Publish a public clinic page with services, doctors, timings, and booking details.
- Capture appointment requests through a patient-friendly form.
- Store leads in a clinic dashboard with clear status tracking.
- Provide a safe AI receptionist for routine clinic information.
- Hand off medical questions to clinic staff instead of attempting diagnosis or treatment advice.

## What ClinicFlow Is Not

ClinicFlow is not an AI doctor.

The AI must never:

- Diagnose a condition.
- Prescribe medicine.
- Recommend dosage.
- Decide a treatment plan.
- Replace consultation with a qualified clinician.

For medical concerns, symptoms, side effects, suitability, emergencies, or treatment decisions, ClinicFlow should ask the patient to consult clinic staff or a qualified doctor.

## Patient Side

Patients should be able to:

- Open a clinic page by slug.
- View clinic name, category, city, area, address, timings, services, doctors, and fee information when provided.
- Submit an appointment request with name, phone number, preferred date, preferred time, service, doctor, and concern note.
- Ask routine clinic questions through the AI receptionist.
- Receive clear messaging that a submitted appointment is only a request until clinic staff manually confirm it.

## Clinic Side

Clinic staff should be able to:

- View appointment requests for their clinic.
- See patient name, phone, service, doctor, preferred date/time, source, status, and notes.
- Change lead status from new to contacted, confirmed, completed, cancelled, or lost.
- Add staff notes for follow-up.
- Review AI chat summaries and captured patient context.

## Admin Side

Admins should be able to:

- Create and manage clinic records.
- Add clinic services, doctors, working hours, and knowledge base entries.
- Configure demo clinics for sales calls.
- Keep clinic data stored in Supabase instead of hardcoding it in the app.

## Core User Flow

1. Patient opens `/clinics/[slug]`.
2. App loads clinic data by slug from Supabase.
3. Patient reviews services, doctors, timings, and location.
4. Patient submits an appointment request.
5. Appointment request is saved with `clinic_id`, optional `service_id`, and optional `doctor_id`.
6. Clinic staff sees the new lead in the dashboard.
7. Staff contacts the patient manually.
8. Staff changes the request status after follow-up.
9. AI receptionist answers routine clinic information and hands off medical questions.

## MVP Features

- Supabase schema for clinics, services, doctors, working hours, appointment requests, clinic knowledge, chat sessions, and chat messages.
- Demo seed data for one aesthetic clinic and one dental clinic.
- Public clinic page loaded by slug.
- Appointment request form.
- Appointment saving in Supabase.
- Clinic dashboard for lead management.
- Admin onboarding screens for clinic setup.
- AI receptionist constrained to clinic information and safe handoff behavior.
- Basic deployment and demo workflow.

## Out-of-Scope Features

- Medical diagnosis or treatment recommendations.
- Automated appointment confirmation without staff review.
- Payments and invoices.
- Patient medical records.
- Prescription management.
- Insurance workflows.
- Multi-location enterprise administration.
- WhatsApp production integration in the first 7-day MVP.
- Complex analytics and reporting.

## 7-Day Execution Plan

### Day 1: Foundation

- Finalize planning documents.
- Create Supabase schema.
- Add demo clinic seed data.
- Define coding agent rules and workflow.

### Day 2: Public Clinic Page

- Build `/clinics/[slug]`.
- Load clinic, services, doctors, working hours, and knowledge base data by slug.
- Present clinic information clearly for patients.

### Day 3: Appointment Requests

- Build appointment request form.
- Save requests to Supabase.
- Show clear confirmation that staff will contact the patient.

### Day 4: Clinic Dashboard

- Build lead list for clinic staff.
- Add status update controls.
- Add staff notes.

### Day 5: Admin Onboarding

- Build basic admin screens for clinic setup.
- Add services, doctors, timings, and knowledge base management.

### Day 6: AI Receptionist

- Add safe AI receptionist flow.
- Load clinic knowledge by `clinic_id`.
- Save chat sessions and messages.
- Enforce no diagnosis, no prescriptions, and no treatment decisions.

### Day 7: Demo Polish

- Improve UI polish.
- Deploy MVP.
- Record demo video.
- Prepare outreach list and sales demo script.

## Definition of Done

The 7-day MVP is done when:

- Two demo clinics are available from Supabase.
- A patient can open a clinic page by slug.
- A patient can submit an appointment request.
- Clinic staff can view and update lead status.
- Admins can manage basic clinic setup data.
- AI receptionist answers routine clinic questions only.
- Medical questions are handed off safely to clinic staff.
- README, planning docs, workflow docs, migration, and seed files are present.
- The deployed demo can be shown to a clinic owner in under five minutes.
