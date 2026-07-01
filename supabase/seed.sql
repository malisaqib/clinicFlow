delete from clinics
where slug in ('glowskin-demo', 'smilecare-demo');

with
glowskin as (
  insert into clinics (
    name,
    slug,
    category,
    city,
    area,
    address,
    phone,
    whatsapp,
    email,
    description,
    status
  )
  values (
    'GlowSkin Aesthetic Clinic',
    'glowskin-demo',
    'aesthetic',
    'Islamabad',
    'F-7',
    'F-7 Markaz, Islamabad',
    '+92 300 1111111',
    '+92 300 1111111',
    'hello@glowskin.example',
    'Demo aesthetic and dermatology clinic for ClinicFlow MVP.',
    'active'
  )
  returning id
),
smilecare as (
  insert into clinics (
    name,
    slug,
    category,
    city,
    area,
    address,
    phone,
    whatsapp,
    email,
    description,
    status
  )
  values (
    'SmileCare Dental Clinic',
    'smilecare-demo',
    'dental',
    'Islamabad',
    'Blue Area',
    'Blue Area, Islamabad',
    '+92 300 2222222',
    '+92 300 2222222',
    'hello@smilecare.example',
    'Demo dental clinic for ClinicFlow MVP.',
    'active'
  )
  returning id
),
glowskin_services as (
  insert into services (
    clinic_id,
    name,
    description,
    category,
    price_min,
    price_max,
    duration_minutes
  )
  select
    glowskin.id,
    service.name,
    service.description,
    service.category,
    service.price_min,
    service.price_max,
    service.duration_minutes
  from glowskin
  cross join (
    values
      ('HydraFacial', 'Deep cleansing facial treatment for skin refresh and glow.', 'facial', 12000, 18000, 60),
      ('Laser Hair Removal', 'Laser hair reduction sessions for selected body areas.', 'laser', 8000, 35000, 45),
      ('Acne Treatment', 'Consultation-based acne care and clinic treatment planning.', 'dermatology', 5000, 20000, 45),
      ('PRP Hair Treatment', 'Platelet-rich plasma hair treatment consultation and sessions.', 'hair', 18000, 30000, 60),
      ('Pigmentation Treatment', 'Clinic-led pigmentation assessment and treatment options.', 'dermatology', 7000, 25000, 45),
      ('Dermatologist Consultation', 'In-clinic consultation with a dermatologist.', 'consultation', 3000, 3000, 30)
  ) as service(name, description, category, price_min, price_max, duration_minutes)
  returning id
),
smilecare_services as (
  insert into services (
    clinic_id,
    name,
    description,
    category,
    price_min,
    price_max,
    duration_minutes
  )
  select
    smilecare.id,
    service.name,
    service.description,
    service.category,
    service.price_min,
    service.price_max,
    service.duration_minutes
  from smilecare
  cross join (
    values
      ('Scaling', 'Dental scaling and cleaning appointment.', 'cleaning', 5000, 8000, 45),
      ('Teeth Whitening', 'In-clinic teeth whitening consultation and procedure.', 'cosmetic', 18000, 30000, 60),
      ('Braces Consultation', 'Orthodontic consultation for braces and alignment options.', 'orthodontics', 2500, 2500, 30),
      ('Root Canal', 'Root canal assessment and treatment planning by dental staff.', 'endodontics', 18000, 35000, 60),
      ('Dental Implants', 'Dental implant consultation and treatment planning.', 'implants', 50000, 150000, 60),
      ('General Dental Checkup', 'Routine dental checkup and oral health review.', 'consultation', 2000, 2000, 30)
  ) as service(name, description, category, price_min, price_max, duration_minutes)
  returning id
),
glowskin_doctors as (
  insert into doctors (
    clinic_id,
    name,
    specialty,
    bio,
    consultation_fee
  )
  select
    glowskin.id,
    doctor.name,
    doctor.specialty,
    doctor.bio,
    doctor.consultation_fee
  from glowskin
  cross join (
    values
      ('Dr. Sara Khan', 'Dermatologist & Aesthetic Physician', 'Demo dermatologist for aesthetic and skin consultations.', 3000),
      ('Dr. Hina Malik', 'Laser Specialist', 'Demo laser specialist for aesthetic treatment inquiries.', 2500)
  ) as doctor(name, specialty, bio, consultation_fee)
  returning id
),
smilecare_doctors as (
  insert into doctors (
    clinic_id,
    name,
    specialty,
    bio,
    consultation_fee
  )
  select
    smilecare.id,
    doctor.name,
    doctor.specialty,
    doctor.bio,
    doctor.consultation_fee
  from smilecare
  cross join (
    values
      ('Dr. Ahmed Raza', 'Dental Surgeon', 'Demo dental surgeon for general dentistry and root canal inquiries.', 2000),
      ('Dr. Mahnoor Ali', 'Orthodontist', 'Demo orthodontist for braces and alignment consultations.', 2500)
  ) as doctor(name, specialty, bio, consultation_fee)
  returning id
),
glowskin_hours as (
  insert into working_hours (
    clinic_id,
    day_of_week,
    open_time,
    close_time,
    is_closed
  )
  select
    glowskin.id,
    hours.day_of_week,
    hours.open_time::time,
    hours.close_time::time,
    hours.is_closed
  from glowskin
  cross join (
    values
      (0, null, null, true),
      (1, '11:00', '20:00', false),
      (2, '11:00', '20:00', false),
      (3, '11:00', '20:00', false),
      (4, '11:00', '20:00', false),
      (5, '11:00', '20:00', false),
      (6, '11:00', '20:00', false)
  ) as hours(day_of_week, open_time, close_time, is_closed)
  returning id
),
smilecare_hours as (
  insert into working_hours (
    clinic_id,
    day_of_week,
    open_time,
    close_time,
    is_closed
  )
  select
    smilecare.id,
    hours.day_of_week,
    hours.open_time::time,
    hours.close_time::time,
    hours.is_closed
  from smilecare
  cross join (
    values
      (0, null, null, true),
      (1, '10:00', '19:00', false),
      (2, '10:00', '19:00', false),
      (3, '10:00', '19:00', false),
      (4, '10:00', '19:00', false),
      (5, '10:00', '19:00', false),
      (6, '10:00', '19:00', false)
  ) as hours(day_of_week, open_time, close_time, is_closed)
  returning id
),
glowskin_knowledge as (
  insert into clinic_knowledge (
    clinic_id,
    title,
    content,
    category
  )
  select
    glowskin.id,
    knowledge.title,
    knowledge.content,
    knowledge.category
  from glowskin
  cross join (
    values
      ('Clinic Timings', 'GlowSkin Aesthetic Clinic is open Monday to Saturday from 11:00 AM to 8:00 PM. Sunday is closed.', 'timings'),
      ('Location', 'GlowSkin Aesthetic Clinic is located in F-7 Markaz, Islamabad.', 'location'),
      ('Consultation Fee', 'Dermatologist consultation fee is PKR 3,000. Laser specialist consultation fee is PKR 2,500.', 'fees'),
      ('Services Offered', 'Services include HydraFacial, Laser Hair Removal, Acne Treatment, PRP Hair Treatment, Pigmentation Treatment, and Dermatologist Consultation.', 'services'),
      ('Appointment Process', 'Patients can submit an appointment request with name, phone number, preferred date, preferred time, service, doctor, and concern note. Clinic staff will contact the patient to confirm the appointment manually.', 'appointments'),
      ('Safe Medical Fallback Rule', 'Do not diagnose, prescribe medicine, suggest dosage, or decide treatment suitability. For symptoms, side effects, emergencies, diagnosis, medication, or treatment decisions, ask the patient to speak with clinic staff or a qualified doctor.', 'safety')
  ) as knowledge(title, content, category)
  returning id
),
smilecare_knowledge as (
  insert into clinic_knowledge (
    clinic_id,
    title,
    content,
    category
  )
  select
    smilecare.id,
    knowledge.title,
    knowledge.content,
    knowledge.category
  from smilecare
  cross join (
    values
      ('Clinic Timings', 'SmileCare Dental Clinic is open Monday to Saturday from 10:00 AM to 7:00 PM. Sunday is closed.', 'timings'),
      ('Location', 'SmileCare Dental Clinic is located in Blue Area, Islamabad.', 'location'),
      ('Consultation Fee', 'General dental consultation fee is PKR 2,000. Orthodontist consultation fee is PKR 2,500.', 'fees'),
      ('Dental Services Offered', 'Services include Scaling, Teeth Whitening, Braces Consultation, Root Canal, Dental Implants, and General Dental Checkup.', 'services'),
      ('Appointment Process', 'Patients can submit an appointment request with name, phone number, preferred date, preferred time, service, doctor, and concern note. Clinic staff will contact the patient to confirm the appointment manually.', 'appointments'),
      ('Safe Medical Fallback Rule', 'Do not diagnose, prescribe medicine, suggest dosage, or decide treatment suitability. For tooth pain, swelling, bleeding, injury, medication, diagnosis, or treatment decisions, ask the patient to speak with clinic staff or a qualified dentist.', 'safety')
  ) as knowledge(title, content, category)
  returning id
)
select
  (select count(*) from glowskin_services) as glowskin_services_inserted,
  (select count(*) from smilecare_services) as smilecare_services_inserted,
  (select count(*) from glowskin_doctors) as glowskin_doctors_inserted,
  (select count(*) from smilecare_doctors) as smilecare_doctors_inserted,
  (select count(*) from glowskin_hours) as glowskin_hours_inserted,
  (select count(*) from smilecare_hours) as smilecare_hours_inserted,
  (select count(*) from glowskin_knowledge) as glowskin_knowledge_inserted,
  (select count(*) from smilecare_knowledge) as smilecare_knowledge_inserted;
