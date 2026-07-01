# Coding Agent Rules

These rules apply to all coding agents working on ClinicFlow.

## Stack

- Use Next.js App Router.
- Use TypeScript.
- Use Tailwind CSS for styling.
- Use Supabase for database, auth, and server-side data access.
- Keep the code simple enough for a 7-day MVP demo.

## Data Rules

- Do not hardcode clinic data long term.
- Load public clinic pages by clinic `slug`.
- Use `clinic_id` everywhere that data belongs to a clinic.
- Keep services, doctors, working hours, knowledge, appointment requests, chat sessions, and chat messages tied to `clinic_id`.
- Treat every submitted appointment as an appointment request until clinic staff manually confirm it.

## AI Safety Rules

ClinicFlow is not an AI doctor.

The AI receptionist may answer:

- Clinic timings.
- Location and contact information.
- Services offered.
- Appointment process.
- Fee information when provided by clinic data.
- General non-medical clinic policies.

The AI receptionist must never:

- Diagnose symptoms or conditions.
- Prescribe medicine.
- Suggest medicine dosage.
- Decide whether a treatment is suitable.
- Replace a clinician consultation.
- Handle emergencies as a medical advisor.

For medical questions, symptoms, side effects, treatment suitability, urgent concerns, or diagnosis requests, the AI must hand off to clinic staff or a qualified clinician.

## Build Order

Build in this order:

1. Public clinic page.
2. Appointment form.
3. Appointment saving.
4. Clinic dashboard.
5. Admin onboarding.
6. AI receptionist.
7. Polish and demo.

## Git Rules

- Work in small commits.
- Use feature branches only for individual tasks.
- Avoid direct commits to `main` after the initial project foundation is established.
- Keep `main` stable and demo-ready.
- Keep pull requests focused.

## Engineering Rules

- Avoid huge rewrites.
- Prefer small, clear changes that can be reviewed quickly.
- Do not add unnecessary packages.
- Keep server-side database access explicit.
- Validate user input before saving.
- Keep patient-facing copy clear that appointment submissions are requests, not confirmed bookings.
- Do not build full production WhatsApp integration until the core web demo works.
