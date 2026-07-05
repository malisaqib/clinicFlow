# ClinicFlow API Reference

Backend API reference for ClinicFlow frontend integration.

## Base URLs

- Local: `http://localhost:3000`
- Vercel: use the active Vercel deployment URL

Example local request:

```txt
http://localhost:3000/api/clinics/glowskin-demo
```

## Environment Notes

Public and frontend APIs do not need an admin key.

Admin APIs require this request header:

```txt
x-admin-api-key: YOUR_ADMIN_API_KEY
```

Set `ADMIN_API_KEY` in local `.env.local` and in Vercel environment variables. Do not expose this value in frontend code, Git, screenshots, logs, or chat messages.

## Public Clinic APIs

### Get Clinic By Slug

```http
GET /api/clinics/[slug]
```

Example:

```http
GET /api/clinics/glowskin-demo
```

Response includes:

- `clinic`
- `services`
- `doctors`
- `workingHours`
- `knowledge`

Use this API to build the public clinic page. Clinic data must come from Supabase by `slug`, not from hardcoded frontend data.

## Appointment Request API

### Create Appointment Request

```http
POST /api/clinics/[slug]/appointment-requests
```

Example:

```http
POST /api/clinics/glowskin-demo/appointment-requests
```

Request body:

```json
{
  "patientName": "Ali",
  "patientPhone": "03001234567",
  "serviceId": "optional uuid",
  "doctorId": "optional uuid",
  "preferredDate": "2026-07-10",
  "preferredTime": "Afternoon",
  "concernNote": "I want to ask about HydraFacial"
}
```

Notes:

- `patientName` is required.
- `patientPhone` is required.
- `serviceId` is optional. If provided, it must belong to the clinic and be active.
- `doctorId` is optional. If provided, it must belong to the clinic and be active.
- Saved request status is always `new`.
- Appointment submissions are requests only. They are not confirmed until clinic staff manually confirms them.

Example success response:

```json
{
  "success": true,
  "appointmentRequest": {
    "id": "request-uuid",
    "status": "new"
  }
}
```

## Dashboard Lead APIs

These APIs are for clinic staff lead management. Auth is not implemented yet, so keep them server-controlled in frontend routing decisions until auth is added.

### List Appointment Requests

```http
GET /api/clinics/[slug]/appointment-requests
GET /api/clinics/[slug]/appointment-requests?status=new
```

Examples:

```http
GET /api/clinics/glowskin-demo/appointment-requests
GET /api/clinics/glowskin-demo/appointment-requests?status=confirmed
```

Response includes appointment request fields:

- `id`
- `patient_name`
- `patient_phone`
- `preferred_date`
- `preferred_time`
- `concern_note`
- `source`
- `status`
- `staff_notes`
- `created_at`
- `service_id`
- `doctor_id`
- `service`
- `doctor`

Allowed `status` filter values:

- `new`
- `contacted`
- `confirmed`
- `completed`
- `cancelled`
- `lost`

### Update Appointment Request

```http
PATCH /api/clinics/[slug]/appointment-requests/[requestId]
```

Example:

```http
PATCH /api/clinics/glowskin-demo/appointment-requests/REQUEST_ID
```

Request body:

```json
{
  "status": "contacted",
  "staffNotes": "Called patient, asked for preferred time."
}
```

Allowed statuses:

- `new`
- `contacted`
- `confirmed`
- `completed`
- `cancelled`
- `lost`

Notes:

- Staff may update `status`, `staffNotes`, or both.
- The API does not automatically confirm any request.
- A request is confirmed only when staff explicitly sends `"status": "confirmed"`.

## AI Receptionist API

### Send Receptionist Message

```http
POST /api/clinics/[slug]/ai/receptionist
```

Note: this endpoint is documented for the AI receptionist backend contract. Confirm the AI receptionist backend branch has been merged into `dev` before wiring the frontend chat widget against it.

Example:

```http
POST /api/clinics/glowskin-demo/ai/receptionist
```

Request body:

```json
{
  "message": "What are your timings?",
  "sessionId": "optional existing session id",
  "patientPhone": "optional phone"
}
```

Response includes:

- `sessionId`
- `reply`
- `intent`
- `safety.medicalAdviceBlocked`

Possible intents:

- `timings`
- `location`
- `services`
- `appointment`
- `fees`
- `doctor`
- `medical_handoff`
- `general`

Notes:

- Works without `LLM_API_KEY` and `LLM_MODEL` by using a safe rule-based fallback.
- If LLM env vars are configured, safety checks still run before any LLM call.
- The AI receptionist never diagnoses.
- The AI receptionist never prescribes.
- The AI receptionist never suggests dosage.
- The AI receptionist never decides treatment.
- Medical questions are handed off to clinic staff or a qualified professional.
- The AI does not create `appointment_requests` from chat yet. Appointment saving remains through the appointment request API.

Example medical handoff response:

```json
{
  "sessionId": "session-uuid",
  "reply": "Thanks for sharing. I can help with clinic information and appointment requests, but I cannot diagnose, prescribe medicine, suggest dosage, or decide treatment. Please book a consultation or share your concern with clinic staff so a qualified professional can guide you.",
  "intent": "medical_handoff",
  "safety": {
    "medicalAdviceBlocked": true
  }
}
```

## Admin APIs

All admin APIs require:

```txt
x-admin-api-key: YOUR_ADMIN_API_KEY
```

If the header is missing or wrong, the API returns `401`.

If `ADMIN_API_KEY` is not configured on the server, the API returns `500`.

### Get Clinic Setup

```http
GET /api/admin/clinics/[slug]/setup
```

Purpose: load all clinic setup data for admin screens.

Response includes:

- clinic profile
- services
- doctors
- working hours
- clinic knowledge

### Update Clinic Profile

```http
PATCH /api/admin/clinics/[slug]/profile
```

Purpose: update allowed clinic profile fields. This endpoint does not allow changing `id` or `slug`.

Example body:

```json
{
  "name": "GlowSkin Aesthetic Clinic",
  "category": "aesthetic",
  "city": "Islamabad",
  "area": "F-7",
  "address": "F-7 Markaz, Islamabad",
  "phone": "+92 300 1111111",
  "whatsapp": "+92 300 1111111",
  "email": "hello@glowskin.example",
  "logo_url": "",
  "description": "Demo aesthetic and dermatology clinic.",
  "status": "active"
}
```

### Create Service

```http
POST /api/admin/clinics/[slug]/services
```

Purpose: create a service linked to the clinic.

Example body:

```json
{
  "name": "HydraFacial",
  "description": "Optional",
  "category": "Skin",
  "priceMin": 5000,
  "priceMax": 12000,
  "durationMinutes": 45,
  "isActive": true
}
```

### Update Service

```http
PATCH /api/admin/clinics/[slug]/services/[serviceId]
```

Purpose: update a service that belongs to the clinic.

Example body:

```json
{
  "priceMin": 6000,
  "priceMax": 13000,
  "isActive": true
}
```

Supported update fields:

- `name`
- `description`
- `category`
- `price_min` or `priceMin`
- `price_max` or `priceMax`
- `duration_minutes` or `durationMinutes`
- `is_active` or `isActive`

### Create Doctor

```http
POST /api/admin/clinics/[slug]/doctors
```

Purpose: create a doctor linked to the clinic.

Example body:

```json
{
  "name": "Dr. Sara Khan",
  "specialty": "Dermatologist",
  "bio": "Optional",
  "consultationFee": 2000,
  "imageUrl": "",
  "isActive": true
}
```

### Update Doctor

```http
PATCH /api/admin/clinics/[slug]/doctors/[doctorId]
```

Purpose: update a doctor that belongs to the clinic.

Example body:

```json
{
  "specialty": "Dermatologist and Aesthetic Physician",
  "consultationFee": 3000,
  "isActive": true
}
```

Supported update fields:

- `name`
- `specialty`
- `bio`
- `consultation_fee` or `consultationFee`
- `image_url` or `imageUrl`
- `is_active` or `isActive`

### Bulk Update Working Hours

```http
PUT /api/admin/clinics/[slug]/working-hours
```

Purpose: replace all working hours for a clinic.

Example body:

```json
{
  "workingHours": [
    {
      "dayOfWeek": 1,
      "openTime": "11:00",
      "closeTime": "20:00",
      "isClosed": false
    }
  ]
}
```

Notes:

- `dayOfWeek` must be an integer from `0` to `6`.
- Existing working hours for the clinic are deleted before inserting the submitted rows.

### Create Clinic Knowledge

```http
POST /api/admin/clinics/[slug]/knowledge
```

Purpose: create a clinic knowledge row for routine clinic information.

Example body:

```json
{
  "title": "Clinic timings",
  "content": "Monday to Saturday, 11 AM to 8 PM.",
  "category": "timings",
  "isActive": true
}
```

### Update Clinic Knowledge

```http
PATCH /api/admin/clinics/[slug]/knowledge/[knowledgeId]
```

Purpose: update a clinic knowledge row that belongs to the clinic.

Example body:

```json
{
  "content": "Monday to Saturday, 11 AM to 8 PM. Sunday is closed.",
  "isActive": true
}
```

Supported update fields:

- `title`
- `content`
- `category`
- `is_active` or `isActive`

The API sets `updated_at` when a knowledge row is updated.

## Frontend Integration Order

1. Build public clinic page using `GET /api/clinics/[slug]`.
2. Build appointment form using `POST /api/clinics/[slug]/appointment-requests`.
3. Build dashboard leads list using `GET /api/clinics/[slug]/appointment-requests`.
4. Build status update buttons using `PATCH /api/clinics/[slug]/appointment-requests/[requestId]`.
5. Build AI chat widget using `POST /api/clinics/[slug]/ai/receptionist`.
6. Build admin setup screens last.

## Safety Note

ClinicFlow is not an AI doctor. Any medical or clinical question must be handed off to clinic staff or a qualified professional. ClinicFlow must not diagnose, prescribe medicine, suggest dosage, decide treatment, or tell a patient what procedure they need.
