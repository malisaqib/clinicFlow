# Demo Clinics

ClinicFlow includes two demo clinics for the 7-day MVP.

## GlowSkin Aesthetic Clinic

- Slug: `glowskin-demo`
- Category: aesthetic
- City: Islamabad
- Area: F-7
- Address: F-7 Markaz, Islamabad
- Timings: Monday to Saturday, 11:00 AM to 8:00 PM
- Sunday: closed

### Services

- HydraFacial
- Laser Hair Removal
- Acne Treatment
- PRP Hair Treatment
- Pigmentation Treatment
- Dermatologist Consultation

### Doctors

- Dr. Sara Khan, Dermatologist & Aesthetic Physician
- Dr. Hina Malik, Laser Specialist

### Knowledge Base

The demo knowledge base includes clinic timings, location, consultation fees, services offered, appointment process, and the safe medical fallback rule.

## SmileCare Dental Clinic

- Slug: `smilecare-demo`
- Category: dental
- City: Islamabad
- Area: Blue Area
- Address: Blue Area, Islamabad
- Timings: Monday to Saturday, 10:00 AM to 7:00 PM
- Sunday: closed

### Services

- Scaling
- Teeth Whitening
- Braces Consultation
- Root Canal
- Dental Implants
- General Dental Checkup

### Doctors

- Dr. Ahmed Raza, Dental Surgeon
- Dr. Mahnoor Ali, Orthodontist

### Knowledge Base

The demo knowledge base includes clinic timings, location, consultation fees, dental services offered, appointment process, and the safe medical fallback rule.

## Exact Patient Booking Flow

1. Patient opens a public clinic page:
   - `/clinics/glowskin-demo`
   - `/clinics/smilecare-demo`
2. App loads clinic data by `slug`.
3. Patient reviews services, doctors, timings, location, and available fee information.
4. Patient selects a service if they already know what they want.
5. Patient selects a doctor if they have a preference.
6. Patient enters name and phone number.
7. Patient enters preferred date and preferred time.
8. Patient adds a short concern note.
9. Patient submits the appointment request.
10. App saves the request with `clinic_id`, optional `service_id`, optional `doctor_id`, patient details, source `form`, and status `new`.
11. Patient sees confirmation copy explaining that the appointment is not confirmed yet.
12. Clinic staff contacts the patient manually.
13. Clinic staff updates the lead status to `contacted`, `confirmed`, `completed`, `cancelled`, or `lost`.

## AI Receptionist Flow

The AI receptionist may answer routine questions using clinic knowledge, such as:

- What are your timings?
- Where is the clinic located?
- Which services do you offer?
- What is the consultation fee?
- How can I book an appointment?

The AI receptionist must hand off medical questions to clinic staff, including:

- What medicine should I take?
- What dosage should I use?
- Do I need a root canal?
- Is laser safe for my skin type?
- What treatment should I choose?
- Is this symptom serious?
