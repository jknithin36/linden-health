// Fictional data for demo purposes only. Not for clinical use.
// Clinical layer for the doctor view: catalogs (diagnoses, orders, medications, exam templates),
// seeded visit notes, lab panels, medications, pre-visit answers and Dr. Emily Chen's inbox.
// Everything is derived deterministically from lib/admin/data.ts, so every refresh matches.

import { appointments, chenDay, doctorBySlug, patientById, refills, threads, vitals as baseVitals } from "@/lib/admin/data"
import { createRng } from "@/lib/admin/seed"
import { addDays, addMinutes, at, dayOf, TODAY } from "@/lib/admin/format"
import type { Appointment, Diagnosis, InboxItem, LabPanel, Medication, NoteVitals, Patient, SchoolForm, VisitNote } from "@/lib/admin/types"

export const CHEN_ID = doctorBySlug("emily-chen")!.id

/* --------------------------------- Catalogs -------------------------------- */

/** Common primary-care diagnoses: ICD-10-style code + plain-language label. */
export const diagnosisCatalog: Diagnosis[] = [
  { code: "J06.9", label: "Upper respiratory infection" },
  { code: "J02.9", label: "Sore throat (pharyngitis)" },
  { code: "J02.0", label: "Strep throat" },
  { code: "J01.90", label: "Sinus infection, acute" },
  { code: "J20.9", label: "Acute bronchitis" },
  { code: "J45.909", label: "Asthma, uncomplicated" },
  { code: "J30.2", label: "Seasonal allergies" },
  { code: "J11.1", label: "Flu (influenza) with respiratory symptoms" },
  { code: "U07.1", label: "COVID-19" },
  { code: "R05.9", label: "Cough" },
  { code: "R50.9", label: "Fever" },
  { code: "H66.91", label: "Ear infection, right" },
  { code: "H66.92", label: "Ear infection, left" },
  { code: "H66.93", label: "Ear infection, both ears" },
  { code: "H10.9", label: "Pink eye (conjunctivitis)" },
  { code: "H61.20", label: "Earwax buildup" },
  { code: "I10", label: "High blood pressure" },
  { code: "E78.5", label: "High cholesterol" },
  { code: "E11.9", label: "Type 2 diabetes, without complications" },
  { code: "E11.65", label: "Type 2 diabetes with high blood sugar" },
  { code: "R73.03", label: "Prediabetes" },
  { code: "E03.9", label: "Underactive thyroid (hypothyroidism)" },
  { code: "E55.9", label: "Vitamin D deficiency" },
  { code: "E66.9", label: "Obesity" },
  { code: "E87.5", label: "High potassium (hyperkalemia)" },
  { code: "N18.2", label: "Chronic kidney disease, stage 2" },
  { code: "I48.91", label: "Atrial fibrillation" },
  { code: "R00.0", label: "Fast heart rate (tachycardia)" },
  { code: "R07.9", label: "Chest pain" },
  { code: "R42", label: "Dizziness" },
  { code: "R51.9", label: "Headache" },
  { code: "G43.909", label: "Migraine" },
  { code: "F41.1", label: "Generalized anxiety" },
  { code: "F32.A", label: "Depression" },
  { code: "G47.00", label: "Trouble sleeping (insomnia)" },
  { code: "K21.9", label: "Acid reflux (GERD)" },
  { code: "K59.00", label: "Constipation" },
  { code: "A08.4", label: "Stomach bug (viral gastroenteritis)" },
  { code: "R10.9", label: "Belly pain" },
  { code: "N39.0", label: "Urinary tract infection" },
  { code: "M54.50", label: "Low back pain" },
  { code: "M25.561", label: "Knee pain, right" },
  { code: "M25.562", label: "Knee pain, left" },
  { code: "M17.9", label: "Knee osteoarthritis" },
  { code: "M25.511", label: "Shoulder pain, right" },
  { code: "M79.10", label: "Muscle aches" },
  { code: "S93.401A", label: "Ankle sprain" },
  { code: "M81.0", label: "Osteoporosis" },
  { code: "L30.9", label: "Rash (dermatitis)" },
  { code: "L20.9", label: "Eczema (atopic dermatitis)" },
  { code: "L23.9", label: "Contact dermatitis" },
  { code: "B35.1", label: "Nail fungus" },
  { code: "L70.0", label: "Acne" },
  { code: "Z00.00", label: "Adult annual physical, normal" },
  { code: "Z00.01", label: "Adult annual physical, abnormal findings" },
  { code: "Z00.129", label: "Well-child check, normal" },
  { code: "Z02.5", label: "Sports physical" },
  { code: "Z23", label: "Vaccine given" },
  { code: "Z79.899", label: "Long-term medication use" },
  { code: "Z71.3", label: "Nutrition counseling" },
  { code: "Z13.220", label: "Cholesterol screening" },
]

export const symptomOptions = [
  "Fever",
  "Chills",
  "Cough",
  "Sore throat",
  "Runny nose",
  "Congestion",
  "Ear pain",
  "Headache",
  "Body aches",
  "Fatigue",
  "Shortness of breath",
  "Chest pain",
  "Dizziness",
  "Nausea",
  "Vomiting",
  "Diarrhea",
  "Belly pain",
  "Rash",
  "Itching",
  "Joint pain",
  "Back pain",
  "Trouble sleeping",
  "Worry or stress",
  "Swelling",
]

/** Normal-exam text the doctor can insert and then edit. */
export const examTemplates = [
  { id: "general", label: "General", text: "General: Alert, well-appearing, in no distress." },
  { id: "heent", label: "HEENT", text: "HEENT: Ears with clear canals and normal eardrums. Throat without redness or swelling. No sinus tenderness. Neck supple, no swollen glands." },
  { id: "heart", label: "Heart", text: "Heart: Regular rate and rhythm. No murmurs." },
  { id: "lungs", label: "Lungs", text: "Lungs: Clear on both sides. No wheezing or crackles. Breathing comfortably." },
  { id: "abdomen", label: "Abdomen", text: "Abdomen: Soft, not tender, not swollen. Normal bowel sounds." },
  { id: "skin", label: "Skin", text: "Skin: Warm and dry. No rashes or lesions." },
]

export type OrderOption = { type: "lab" | "imaging" | "referral" | "vaccine"; name: string }

export const orderCatalog: OrderOption[] = [
  { type: "lab", name: "Basic metabolic panel (BMP)" },
  { type: "lab", name: "Comprehensive metabolic panel (CMP)" },
  { type: "lab", name: "Complete blood count (CBC)" },
  { type: "lab", name: "Hemoglobin A1c" },
  { type: "lab", name: "Lipid panel" },
  { type: "lab", name: "TSH (thyroid)" },
  { type: "lab", name: "Vitamin D, 25-hydroxy" },
  { type: "lab", name: "Urinalysis" },
  { type: "lab", name: "Rapid strep test" },
  { type: "lab", name: "Throat culture" },
  { type: "lab", name: "Flu and COVID-19 swab" },
  { type: "lab", name: "Potassium recheck" },
  { type: "imaging", name: "Chest X-ray" },
  { type: "imaging", name: "Knee X-ray" },
  { type: "imaging", name: "Lower back X-ray" },
  { type: "imaging", name: "Abdominal ultrasound" },
  { type: "imaging", name: "Bone density scan (DEXA)" },
  { type: "referral", name: "Cardiology" },
  { type: "referral", name: "Dermatology" },
  { type: "referral", name: "Orthopedics" },
  { type: "referral", name: "Physical therapy" },
  { type: "referral", name: "Nutrition counseling" },
  { type: "referral", name: "Behavioral health" },
  { type: "referral", name: "Endocrinology" },
  { type: "vaccine", name: "Flu shot" },
  { type: "vaccine", name: "COVID-19 booster" },
  { type: "vaccine", name: "Tdap booster" },
  { type: "vaccine", name: "Shingles vaccine" },
  { type: "vaccine", name: "Pneumococcal vaccine" },
]

/** Prescribable medications. `classes` are matched against patient allergies. */
export const medicationCatalog: { name: string; doses: string[]; frequency: string; classes: string[] }[] = [
  { name: "Amoxicillin", doses: ["250 mg", "500 mg", "875 mg"], frequency: "Twice a day for 10 days", classes: ["Penicillin", "Amoxicillin"] },
  { name: "Amoxicillin-clavulanate", doses: ["500/125 mg", "875/125 mg"], frequency: "Twice a day for 7 days", classes: ["Penicillin", "Amoxicillin"] },
  { name: "Penicillin VK", doses: ["250 mg", "500 mg"], frequency: "Twice a day for 10 days", classes: ["Penicillin"] },
  { name: "Cephalexin", doses: ["250 mg", "500 mg"], frequency: "Four times a day for 7 days", classes: [] },
  { name: "Azithromycin", doses: ["250 mg", "500 mg"], frequency: "Once a day for 5 days", classes: [] },
  { name: "Doxycycline", doses: ["100 mg"], frequency: "Twice a day for 7 days", classes: [] },
  { name: "Sulfamethoxazole-trimethoprim", doses: ["800/160 mg"], frequency: "Twice a day for 3 days", classes: ["Sulfa drugs"] },
  { name: "Nitrofurantoin", doses: ["100 mg"], frequency: "Twice a day for 5 days", classes: [] },
  { name: "Ibuprofen", doses: ["400 mg", "600 mg", "800 mg"], frequency: "Every 8 hours as needed", classes: ["Ibuprofen"] },
  { name: "Naproxen", doses: ["250 mg", "500 mg"], frequency: "Twice a day as needed", classes: ["Ibuprofen"] },
  { name: "Acetaminophen", doses: ["325 mg", "500 mg"], frequency: "Every 6 hours as needed", classes: [] },
  { name: "Acetaminophen-codeine", doses: ["300/30 mg"], frequency: "Every 6 hours as needed", classes: ["Codeine"] },
  { name: "Lisinopril", doses: ["5 mg", "10 mg", "20 mg", "40 mg"], frequency: "Once a day", classes: [] },
  { name: "Amlodipine", doses: ["2.5 mg", "5 mg", "10 mg"], frequency: "Once a day", classes: [] },
  { name: "Losartan", doses: ["25 mg", "50 mg", "100 mg"], frequency: "Once a day", classes: [] },
  { name: "Hydrochlorothiazide", doses: ["12.5 mg", "25 mg"], frequency: "Once a day", classes: ["Sulfa drugs"] },
  { name: "Metformin", doses: ["500 mg", "850 mg", "1000 mg"], frequency: "Twice a day with meals", classes: [] },
  { name: "Atorvastatin", doses: ["10 mg", "20 mg", "40 mg"], frequency: "Once a day", classes: [] },
  { name: "Rosuvastatin", doses: ["5 mg", "10 mg", "20 mg"], frequency: "Once a day", classes: [] },
  { name: "Levothyroxine", doses: ["25 mcg", "50 mcg", "75 mcg", "100 mcg"], frequency: "Once a day, before breakfast", classes: [] },
  { name: "Sertraline", doses: ["25 mg", "50 mg", "100 mg"], frequency: "Once a day", classes: [] },
  { name: "Omeprazole", doses: ["20 mg", "40 mg"], frequency: "Once a day, before breakfast", classes: [] },
  { name: "Cetirizine", doses: ["5 mg", "10 mg"], frequency: "Once a day", classes: [] },
  { name: "Fluticasone nasal spray", doses: ["50 mcg/spray"], frequency: "2 sprays each nostril once a day", classes: [] },
  { name: "Albuterol inhaler", doses: ["90 mcg/puff"], frequency: "2 puffs every 4–6 hours as needed", classes: [] },
  { name: "Benzonatate", doses: ["100 mg", "200 mg"], frequency: "Three times a day as needed for cough", classes: [] },
  { name: "Prednisone", doses: ["10 mg", "20 mg"], frequency: "Once a day for 5 days", classes: [] },
  { name: "Hydrocortisone cream 1%", doses: ["1%"], frequency: "Apply twice a day for 7 days", classes: [] },
  { name: "Triamcinolone cream", doses: ["0.1%"], frequency: "Apply twice a day for 14 days", classes: [] },
  { name: "Ondansetron", doses: ["4 mg"], frequency: "Every 8 hours as needed for nausea", classes: [] },
  { name: "Vitamin D3", doses: ["1,000 IU", "2,000 IU"], frequency: "Once a day", classes: [] },
]

export const pharmacyOptions = ["Linden Health Pharmacy, Cleveland", "Lakeview Pharmacy, Lakewood", "Birchwood Pharmacy, Beachwood", "Lake Erie Drugstore, Cleveland"]

/** Plain-language allergy warning for a medication, or null when there's no match. */
export function allergyConflict(allergies: string[], medication: string) {
  const med = medicationCatalog.find((m) => m.name.toLowerCase() === medication.trim().toLowerCase())
  const hit = allergies.find((a) => med?.classes.includes(a) || a.toLowerCase() === medication.trim().toLowerCase())
  if (!hit) return null
  return hit === "Penicillin" && med?.name !== "Penicillin VK" ? `${med?.name ?? medication} is a penicillin-type antibiotic. Patient is allergic to penicillin.` : `Patient is allergic to ${hit.toLowerCase()}.`
}

/** Normal ranges used to label vitals (adult; children use wider heart-rate ranges). */
export function vitalFlags(v: Partial<NoteVitals>, age: number) {
  const out: Partial<Record<keyof NoteVitals, { label: string; tone: "amber" | "red" }>> = {}
  const { bpSystolic: s, bpDiastolic: d, heartRate: hr, tempF: t, respRate: rr, spo2, bmi } = v
  if (s != null && d != null) {
    if (s >= 180 || d >= 120) out.bpSystolic = { label: "Very high", tone: "red" }
    else if (s >= 140 || d >= 90) out.bpSystolic = { label: "High", tone: "red" }
    else if (s >= 130 || d >= 80) out.bpSystolic = { label: "Elevated", tone: "amber" }
    else if (s < 90 || d < 60) out.bpSystolic = { label: "Low", tone: "amber" }
  }
  const [hrLo, hrHi] = age < 6 ? [80, 140] : age < 13 ? [70, 120] : [60, 100]
  if (hr != null) {
    if (hr > hrHi + 20 || hr < hrLo - 15) out.heartRate = { label: hr > hrHi ? "Very high" : "Very low", tone: "red" }
    else if (hr > hrHi || hr < hrLo) out.heartRate = { label: hr > hrHi ? "High" : "Low", tone: "amber" }
  }
  if (t != null) {
    if (t >= 103) out.tempF = { label: "High fever", tone: "red" }
    else if (t >= 100.4) out.tempF = { label: "Fever", tone: "amber" }
    else if (t < 95) out.tempF = { label: "Low", tone: "red" }
  }
  const [rrLo, rrHi] = age < 13 ? [18, 30] : [12, 20]
  if (rr != null && (rr > rrHi || rr < rrLo)) out.respRate = { label: rr > rrHi ? "High" : "Low", tone: rr > rrHi + 6 ? "red" : "amber" }
  if (spo2 != null) {
    if (spo2 < 90) out.spo2 = { label: "Very low", tone: "red" }
    else if (spo2 < 95) out.spo2 = { label: "Low", tone: "amber" }
  }
  if (bmi != null && age >= 18) {
    if (bmi >= 30) out.bmi = { label: "Obese range", tone: "amber" }
    else if (bmi >= 25) out.bmi = { label: "Overweight range", tone: "amber" }
    else if (bmi < 18.5) out.bmi = { label: "Underweight range", tone: "amber" }
  }
  return out
}

export const bmiOf = (weightLb: number | null, heightIn: number | null) => (weightLb && heightIn ? Math.round(((703 * weightLb) / (heightIn * heightIn)) * 10) / 10 : null)

/* ------------------------------ Note templates ----------------------------- */

type Template = { test: RegExp; dx: string[]; symptoms: string[]; hpi: string; exam: string[]; plan: string; instructions: string; followUp?: { inDays: number; reason: string } }

const templates: Template[] = [
  { test: /sore throat|strep/i, dx: ["J02.9"], symptoms: ["Sore throat", "Fever"], hpi: "Sore throat for 2 days with fever up to 101 °F at home. Painful to swallow. No cough. Eating and drinking less than usual.", exam: ["general", "heent"], plan: "Rapid strep test in clinic. Supportive care with fluids, rest and acetaminophen as needed.", instructions: "Drink plenty of fluids and rest. Use acetaminophen for pain or fever as directed on the label. Call us if you can’t swallow liquids, have trouble breathing, or the fever lasts more than 3 days." },
  { test: /fever and cough|cough|cold|flu/i, dx: ["J06.9"], symptoms: ["Cough", "Congestion", "Runny nose"], hpi: "Cough and congestion for about a week. No shortness of breath. Mild fatigue. Tried over-the-counter cough syrup with some relief.", exam: ["general", "heent", "lungs"], plan: "Likely viral upper respiratory infection. Supportive care. No antibiotics needed at this time.", instructions: "This is most likely a virus and should get better on its own over 1–2 weeks. Rest, drink fluids, and use honey or a humidifier for the cough. Come back if you have trouble breathing or a fever over 102 °F.", followUp: { inDays: 14, reason: "If the cough isn’t better" } },
  { test: /sinus/i, dx: ["J01.90"], symptoms: ["Congestion", "Headache"], hpi: "Sinus pressure and congestion for 10 days, worse over the last 3 days. Thick nasal drainage. No fever.", exam: ["general", "heent"], plan: "Acute sinusitis. Saline rinses and nasal steroid spray. Antibiotic if not better in 3–5 days.", instructions: "Use saltwater nose rinses twice a day and the nasal spray once a day. Most sinus infections clear without antibiotics. Call us if you get a high fever or swelling around your eyes." },
  { test: /ear/i, dx: ["H66.92"], symptoms: ["Ear pain", "Fever"], hpi: "Left ear pain since yesterday. Low-grade fever overnight. Recent cold.", exam: ["general", "heent"], plan: "Left ear infection. Pain control and antibiotic.", instructions: "Give the antibiotic for the full course, even if your child feels better. Use acetaminophen or ibuprofen for pain. Call us if the pain isn’t better in 2–3 days." },
  { test: /blood pressure|hypertension/i, dx: ["I10"], symptoms: [], hpi: "Here to recheck blood pressure. Taking medication daily. Home readings mostly in the 130s/80s. No headaches, chest pain or dizziness.", exam: ["general", "heart", "lungs"], plan: "Blood pressure close to goal. Continue current medication. Lower salt, keep up walking. Basic metabolic panel to check kidneys and potassium.", instructions: "Keep taking your blood pressure medicine every day. Check your blood pressure at home a few times a week and bring the numbers to your next visit.", followUp: { inDays: 90, reason: "Blood pressure recheck" } },
  { test: /diabetes|a1c/i, dx: ["E11.9"], symptoms: [], hpi: "Diabetes follow-up. Taking metformin twice daily. Home sugars mostly 110–150 fasting. No low sugars. Walking 3 times a week.", exam: ["general", "heart", "lungs"], plan: "Diabetes reasonably controlled. Continue metformin. Hemoglobin A1c today. Annual eye exam reminder.", instructions: "Keep taking metformin with meals. Aim for 30 minutes of walking most days. We’ll send you your A1c result in the portal.", followUp: { inDays: 90, reason: "Diabetes check" } },
  { test: /thyroid/i, dx: ["E03.9"], symptoms: ["Fatigue"], hpi: "Thyroid follow-up. Taking levothyroxine every morning on an empty stomach. Energy improved. No palpitations.", exam: ["general", "heart"], plan: "Hypothyroidism, stable. Continue levothyroxine. Recheck TSH in 6 months.", instructions: "Take your thyroid pill first thing in the morning, 30–60 minutes before breakfast or coffee." },
  { test: /cholesterol|lipid/i, dx: ["E78.5"], symptoms: [], hpi: "Cholesterol follow-up. Taking atorvastatin nightly. No muscle aches. Working on diet changes.", exam: ["general", "heart"], plan: "High cholesterol, improving. Continue atorvastatin. Repeat lipid panel in 3 months.", instructions: "Keep taking your cholesterol medicine. Eat more vegetables, beans and whole grains, and less fried food." },
  { test: /back/i, dx: ["M54.50"], symptoms: ["Back pain"], hpi: "Low back pain for 5 days after moving furniture. No numbness, weakness or trouble with bladder or bowels.", exam: ["general"], plan: "Muscle strain. Heat, gentle stretching, ibuprofen as needed. Physical therapy if not better in 2 weeks.", instructions: "Stay active with gentle walking. Use heat for 20 minutes a few times a day. Call us right away if you have numbness, weakness, or trouble controlling your bladder.", followUp: { inDays: 14, reason: "If back pain isn’t better" } },
  { test: /anxiety|worry|stress/i, dx: ["F41.1"], symptoms: ["Worry or stress", "Trouble sleeping"], hpi: "Anxiety check-in. Taking sertraline daily for 3 months. Sleep better. Still some stress at work. No thoughts of self-harm.", exam: ["general"], plan: "Generalized anxiety, improving. Continue sertraline. Offered referral to behavioral health for therapy.", instructions: "Keep taking your medicine every day. Try the breathing exercises we talked about. You can always message us or call 988 if you feel unsafe." },
  { test: /rash|itch|eczema/i, dx: ["L30.9"], symptoms: ["Rash", "Itching"], hpi: "Itchy rash on both forearms for a week. New laundry soap. No fever.", exam: ["general", "skin"], plan: "Contact dermatitis. Stop new soap. Steroid cream twice daily for 1–2 weeks.", instructions: "Switch back to your old laundry soap. Use the cream twice a day on the rash for up to 2 weeks. Avoid hot showers." },
  { test: /knee/i, dx: ["M25.561"], symptoms: ["Joint pain"], hpi: "Right knee pain, worse with stairs. Some morning stiffness. No locking or giving way.", exam: ["general"], plan: "Likely knee osteoarthritis. Exercise and weight loss, acetaminophen or topical NSAID. X-ray if not improving.", instructions: "Strengthening exercises and low-impact activity like swimming or biking help most. Use ice after activity." },
  { test: /annual|physical|yearly|checkup|well/i, dx: ["Z00.00"], symptoms: [], hpi: "Here for an annual physical. Feels well. No new concerns. Exercises 2–3 times a week. Non-smoker.", exam: ["general", "heent", "heart", "lungs", "abdomen", "skin"], plan: "Healthy adult exam. Routine blood work. Vaccines up to date. Flu shot offered.", instructions: "Everything looks good. Keep up the exercise. We’ll send your lab results in the portal in a few days.", followUp: { inDays: 365, reason: "Annual physical" } },
  { test: /medication review|lab results review/i, dx: ["Z79.899"], symptoms: [], hpi: "Reviewing current medications and recent labs. Taking everything as prescribed. No side effects.", exam: ["general", "heart", "lungs"], plan: "Medications reviewed and reconciled. No changes today.", instructions: "No changes to your medicines today. Keep your updated medication list with you." },
]

const fallback: Template = { test: /.*/, dx: ["Z79.899"], symptoms: [], hpi: "Here for a scheduled visit. No new concerns today.", exam: ["general"], plan: "Discussed findings and next steps.", instructions: "Call or message us with any questions." }
const templateFor = (reason: string) => templates.find((t) => t.test.test(reason)) ?? fallback
const dx = (codes: string[]) => codes.map((c) => diagnosisCatalog.find((d) => d.code === c)!).filter(Boolean)
const examText = (ids: string[]) => ids.map((id) => examTemplates.find((e) => e.id === id)!.text).join("\n")

const hashOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

const emptyVitals: NoteVitals = { bpSystolic: null, bpDiastolic: null, heartRate: null, tempF: null, respRate: null, spo2: null, weightLb: null, heightIn: null, bmi: null, painScore: null }

/** Vitals for a visit: the recorded ones when we have them, otherwise a plausible set for the patient. */
// First recorded set per appointment (reversed so earlier entries win), instead of a .find per note.
const recordedVitals = new Map([...baseVitals].reverse().map((v) => [v.appointmentId, v]))

function vitalsFor(a: Appointment, p: Patient): NoteVitals {
  const v = recordedVitals.get(a.id)
  const rng = createRng(hashOf(a.id))
  const kid = p.age < 13
  const height = v?.heightIn ?? (kid ? 40 + p.age * 2.4 : p.sex === "F" ? rng.int(61, 68) : rng.int(66, 74))
  const weight = v?.weightLb ?? (kid ? Math.round(30 + p.age * 6.5) : rng.int(p.sex === "F" ? 125 : 155, p.sex === "F" ? 195 : 225))
  const sys = v?.systolic ?? (p.conditions.includes("High blood pressure") ? rng.int(128, 142) : kid ? rng.int(95, 110) : rng.int(108, 128))
  const fever = /fever|flu|ear|sore throat/i.test(a.reason)
  return {
    bpSystolic: sys,
    bpDiastolic: v?.diastolic ?? (kid ? rng.int(55, 70) : rng.int(68, sys > 130 ? 88 : 82)),
    heartRate: v?.heartRate ?? (kid ? rng.int(80, 110) : rng.int(62, 88)),
    tempF: v?.tempF ?? (fever ? Math.round(rng.float(99.8, 101.6) * 10) / 10 : Math.round(rng.float(97.6, 98.8) * 10) / 10),
    respRate: kid ? rng.int(18, 24) : rng.int(12, 18),
    spo2: rng.int(96, 100),
    weightLb: weight,
    heightIn: Math.round(height),
    bmi: v?.bmi ?? bmiOf(weight, Math.round(height)),
    painScore: /pain|ache/i.test(a.reason) ? rng.int(3, 6) : 0,
  }
}

/* ------------------------------- Seeded notes ------------------------------ */

const isChenToday = (a: Appointment) => a.doctorId === CHEN_ID && dayOf(a.start) === TODAY
const unsignedChen = (a: Appointment) => isChenToday(a) && chenDay.unsigned.includes(a.start.slice(11))

/** A full note from the reason's template. */
function filledNote(a: Appointment, p: Patient, signed: boolean): VisitNote {
  const t = templateFor(a.reason)
  const kidEar = /ear/i.test(a.reason) && p.age < 13
  const prescriptions =
    /ear/i.test(a.reason) && !p.allergies.some((x) => x === "Penicillin" || x === "Amoxicillin")
      ? [{ medication: "Amoxicillin", dose: kidEar ? "250 mg" : "875 mg", frequency: "Twice a day for 10 days", quantity: 20, refills: 0, pharmacy: pharmacyOptions[0] }]
      : /rash/i.test(a.reason)
        ? [{ medication: "Triamcinolone cream", dose: "0.1%", frequency: "Apply twice a day for 14 days", quantity: 1, refills: 0, pharmacy: pharmacyOptions[0] }]
        : []
  const orders =
    /diabetes/i.test(a.reason)
      ? [{ id: `o-${a.id}-1`, type: "lab" as const, name: "Hemoglobin A1c", status: dayOf(a.start) < TODAY ? ("resulted" as const) : ("ordered" as const) }]
      : /blood pressure/i.test(a.reason)
        ? [{ id: `o-${a.id}-1`, type: "lab" as const, name: "Basic metabolic panel (BMP)", status: "ordered" as const }]
        : /annual|physical/i.test(a.reason)
          ? [
              { id: `o-${a.id}-1`, type: "lab" as const, name: "Lipid panel", status: "resulted" as const },
              { id: `o-${a.id}-2`, type: "lab" as const, name: "Comprehensive metabolic panel (CMP)", status: "resulted" as const },
            ]
          : []
  const updatedAt = a.completedAt ?? addMinutes(a.start, a.durationMin)
  return {
    id: `n-${a.id}`,
    appointmentId: a.id,
    patientId: p.id,
    doctorId: a.doctorId,
    status: signed ? "signed" : "in-progress",
    vitals: vitalsFor(a, p),
    subjective: { chiefComplaint: a.reason, historyOfPresentIllness: t.hpi, symptoms: t.symptoms },
    objective: { exam: examText(t.exam) },
    assessment: { diagnoses: kidEar ? dx(["H66.92"]) : dx(t.dx) },
    plan: { text: t.plan, orders, prescriptions, ...(t.followUp ? { followUp: t.followUp } : {}) },
    patientInstructions: t.instructions,
    ...(signed ? { signedAt: dayOf(updatedAt) === TODAY ? addMinutes(updatedAt, 6) : addMinutes(updatedAt, 45) } : {}),
    updatedAt,
  }
}

/** The note as generated (before any changes made in this tab). */
export function seedNote(a: Appointment): VisitNote {
  const p = patientById.get(a.patientId)!
  if (a.status === "completed") return filledNote(a, p, !unsignedChen(a))
  const blank: VisitNote = {
    id: `n-${a.id}`,
    appointmentId: a.id,
    patientId: p.id,
    doctorId: a.doctorId,
    status: "not-started",
    vitals: { ...emptyVitals },
    subjective: { chiefComplaint: "", historyOfPresentIllness: "", symptoms: [] },
    objective: { exam: "" },
    assessment: { diagnoses: [] },
    plan: { text: "", orders: [], prescriptions: [] },
    patientInstructions: "",
    updatedAt: a.bookedAt,
  }
  // Robert Hayes: Dr. Chen started his note at 2:04 PM. Blood pressure is up today.
  if (a.patientId === "p-hayes" && isChenToday(a)) {
    return {
      ...blank,
      status: "in-progress",
      vitals: { bpSystolic: 150, bpDiastolic: 95, heartRate: 78, tempF: 98.1, respRate: 16, spo2: 97, weightLb: 204, heightIn: 70, bmi: bmiOf(204, 70), painScore: 0 },
      subjective: {
        chiefComplaint: "Follow-up (blood pressure)",
        historyOfPresentIllness: "72-year-old here for blood pressure follow-up. Home readings 145–155/90–95 over the last 2 weeks. Taking lisinopril 20 mg daily. Ran out of amlodipine 10 days ago. Mild morning headaches, no chest pain or shortness of breath.",
        symptoms: ["Headache"],
      },
      objective: { exam: examText(["general", "heart", "lungs"]) },
      updatedAt: "2026-10-19T14:18",
    }
  }
  // Checked-in patients already have the nurse's vitals.
  if (a.status === "checked-in" || a.status === "waiting" || a.status === "with-doctor") {
    const v = vitalsFor(a, p)
    if (a.patientId === "p-gkim") Object.assign(v, { tempF: 101.4, heartRate: 112, respRate: 22, spo2: 98, bpSystolic: 102, bpDiastolic: 64, weightLb: 58, heightIn: 50, bmi: bmiOf(58, 50), painScore: 5 })
    return { ...blank, vitals: v, updatedAt: a.checkedInAt ?? blank.updatedAt }
  }
  return blank
}

/* ---------------------------- Pre-visit answers ---------------------------- */

export function preVisitAnswers(a: Appointment): { question: string; answer: string }[] {
  if (!a.formsDone) return []
  const p = patientById.get(a.patientId)!
  if (a.patientId === "p-gkim")
    return [
      { question: "What brings you in today?", answer: "Sore throat since Saturday, fever 101.8 °F last night. Not eating much." },
      { question: "Any medicine taken for this?", answer: "Children’s acetaminophen at 7 AM." },
      { question: "Anyone sick at home or school?", answer: "Two kids in her class had strep last week." },
      { question: "Allergies", answer: "Penicillin (hives as a toddler)." },
    ]
  if (a.patientId === "p-hayes")
    return [
      { question: "What brings you in today?", answer: "Blood pressure check. My home numbers have been higher." },
      { question: "Changes to your medicines?", answer: "Ran out of amlodipine about 10 days ago." },
      { question: "Any new symptoms?", answer: "Some headaches in the morning." },
      { question: "Home readings", answer: "Mostly 145–155 over 90–95." },
    ]
  const t = templateFor(a.reason)
  return [
    { question: "What brings you in today?", answer: a.reason },
    { question: "Any new symptoms?", answer: t.symptoms.length ? t.symptoms.join(", ") : "None" },
    { question: "Changes to your medicines?", answer: "No changes" },
    { question: "Allergies", answer: p.allergies.length ? p.allergies.join(", ") : "No known allergies" },
  ]
}

/* -------------------------------- Medications ------------------------------ */

const conditionMeds: Record<string, { name: string; dose: string; frequency: string }[]> = {
  "High blood pressure": [{ name: "Lisinopril", dose: "20 mg", frequency: "Once a day" }],
  "Type 2 diabetes": [{ name: "Metformin", dose: "500 mg", frequency: "Twice a day with meals" }],
  "High cholesterol": [{ name: "Atorvastatin", dose: "20 mg", frequency: "Once a day at bedtime" }],
  Hypothyroidism: [{ name: "Levothyroxine", dose: "50 mcg", frequency: "Once a day, before breakfast" }],
  Asthma: [{ name: "Albuterol inhaler", dose: "90 mcg/puff", frequency: "2 puffs every 4–6 hours as needed" }],
  Anxiety: [{ name: "Sertraline", dose: "50 mg", frequency: "Once a day" }],
  GERD: [{ name: "Omeprazole", dose: "20 mg", frequency: "Once a day, before breakfast" }],
  "Seasonal allergies": [{ name: "Cetirizine", dose: "10 mg", frequency: "Once a day" }],
  "Atrial fibrillation": [{ name: "Apixaban", dose: "5 mg", frequency: "Twice a day" }],
  "Low vitamin D": [{ name: "Vitamin D3", dose: "2,000 IU", frequency: "Once a day" }],
  Migraine: [{ name: "Sumatriptan", dose: "50 mg", frequency: "At migraine onset, may repeat once" }],
  Osteoporosis: [{ name: "Alendronate", dose: "70 mg", frequency: "Once a week" }],
}

/** Medications on file before any changes in this tab (the Mitchells match the portal). */
export function baseMedications(p: Patient): Medication[] {
  const rng = createRng(hashOf(p.id))
  const list = p.conditions.flatMap((c) => conditionMeds[c] ?? [])
  // Robert Hayes also takes amlodipine (he ran out 10 days ago).
  if (p.id === "p-hayes") list.push({ name: "Amlodipine", dose: "10 mg", frequency: "Once a day" })
  if (p.id === "p-david") return [{ id: "med-p-david-lisinopril", patientId: p.id, name: "Lisinopril", dose: "10 mg", frequency: "Once a day, in the morning", prescriberId: doctorBySlug("omar-khalil")!.id, startedAt: "2026-04-08", lastFilledAt: "2026-09-24", refillsLeft: 1, status: "active" }]
  if (p.id === "p-sarah") return [{ id: "med-p-sarah-vitamin-d", patientId: p.id, name: "Vitamin D3", dose: "2,000 IU", frequency: "Once a day, with food", prescriberId: CHEN_ID, startedAt: "2026-04-10", lastFilledAt: "2026-09-02", refillsLeft: 0, status: "active" }]
  if (p.portalId) return []
  return list.map((m, i) => ({
    id: `med-${p.id}-${i}`,
    patientId: p.id,
    name: m.name,
    dose: m.dose,
    frequency: m.frequency,
    prescriberId: p.primaryDoctorId,
    startedAt: at(addDays(TODAY, -rng.int(120, 1400)), 0).slice(0, 10),
    lastFilledAt: p.id === "p-hayes" && m.name === "Amlodipine" ? "2026-08-10" : at(addDays(TODAY, -rng.int(12, 34)), 0).slice(0, 10),
    refillsLeft: rng.int(0, 3),
    status: "active",
  }))
}

/* --------------------------------- Lab panels ------------------------------ */

const potassiumPatient = "p-1146" // Tomas Mwangi, 66 · CKD stage 2, diabetes, high blood pressure, on lisinopril
const chenToday = appointments.filter(isChenToday)
const chenAt = (hhmm: string) => chenToday.find((a) => a.start.slice(11) === hhmm)!
const refillFor = (id: string) => refills.find((r) => r.id === id)!

const test = (name: string, value: number, unit: string, low: number | undefined, high: number | undefined, history: [string, number][]) => ({ name, value, unit, ...(low !== undefined ? { low } : {}), ...(high !== undefined ? { high } : {}), history: history.map(([date, v]) => ({ date, value: v })) })

export const labPanels: LabPanel[] = [
  {
    id: "lab-bmp-mwangi",
    patientId: potassiumPatient,
    doctorId: CHEN_ID,
    title: "Basic metabolic panel (BMP)",
    collectedAt: "2026-10-16T08:10",
    resultedAt: "2026-10-19T10:40",
    tests: [
      test("Potassium", 5.8, "mmol/L", 3.5, 5.1, [["2026-04-14", 4.6], ["2026-07-15", 4.9]]),
      test("Sodium", 138, "mmol/L", 135, 145, [["2026-04-14", 140], ["2026-07-15", 139]]),
      test("Creatinine", 1.4, "mg/dL", 0.7, 1.3, [["2026-04-14", 1.1], ["2026-07-15", 1.2]]),
      test("eGFR", 54, "mL/min", 60, undefined, [["2026-04-14", 68], ["2026-07-15", 61]]),
      test("Glucose (fasting)", 128, "mg/dL", 70, 99, [["2026-04-14", 134], ["2026-07-15", 131]]),
    ],
  },
  {
    id: "lab-a1c-nguyen",
    patientId: chenAt("08:30").patientId,
    doctorId: CHEN_ID,
    title: "Hemoglobin A1c",
    collectedAt: "2026-10-19T08:40",
    resultedAt: "2026-10-19T12:10",
    tests: [test("Hemoglobin A1c", 7.4, "%", 4, 5.6, [["2026-01-20", 7.9], ["2026-04-22", 7.6], ["2026-07-21", 7.5]])],
  },
  {
    id: "lab-lipid-moreno",
    patientId: chenAt("10:30").patientId,
    doctorId: CHEN_ID,
    title: "Lipid panel",
    collectedAt: "2026-10-16T07:55",
    resultedAt: "2026-10-18T16:05",
    tests: [
      test("LDL cholesterol", 142, "mg/dL", undefined, 99, [["2026-04-09", 168]]),
      test("HDL cholesterol", 44, "mg/dL", 40, undefined, [["2026-04-09", 41]]),
      test("Triglycerides", 176, "mg/dL", undefined, 149, [["2026-04-09", 204]]),
      test("Total cholesterol", 214, "mg/dL", undefined, 199, [["2026-04-09", 246]]),
    ],
  },
  {
    id: "lab-cbc-mahmoud",
    patientId: chenAt("11:00").patientId,
    doctorId: CHEN_ID,
    title: "Complete blood count (CBC)",
    collectedAt: "2026-10-19T11:20",
    resultedAt: "2026-10-19T13:20",
    tests: [
      test("White blood cells", 8.2, "K/µL", 4, 11, []),
      test("Hemoglobin", 13.4, "g/dL", 12, 15.5, []),
      test("Platelets", 262, "K/µL", 150, 400, []),
    ],
  },
  // Labs behind the refill requests (already reviewed).
  { id: "lab-a1c-refill", patientId: refillFor("rf-chen-metformin").patientId, doctorId: CHEN_ID, title: "Hemoglobin A1c", collectedAt: "2026-08-12T08:00", resultedAt: "2026-08-13T11:00", tests: [test("Hemoglobin A1c", 6.9, "%", 4, 5.6, [["2026-02-10", 7.2], ["2026-05-12", 7.0]])] },
  { id: "lab-tsh-refill", patientId: refillFor("rf-chen-levothyroxine").patientId, doctorId: CHEN_ID, title: "TSH (thyroid)", collectedAt: "2026-07-08T08:20", resultedAt: "2026-07-09T10:00", tests: [test("TSH", 2.4, "mIU/L", 0.4, 4.5, [["2026-01-06", 5.1], ["2026-04-07", 3.2]])] },
  {
    id: "lab-lipid-refill",
    patientId: refillFor("rf-chen-atorvastatin").patientId,
    doctorId: CHEN_ID,
    title: "Lipid panel",
    collectedAt: "2026-06-17T07:50",
    resultedAt: "2026-06-18T12:00",
    tests: [test("LDL cholesterol", 96, "mg/dL", undefined, 99, [["2025-12-09", 151]]), test("HDL cholesterol", 52, "mg/dL", 40, undefined, [["2025-12-09", 47]])],
  },
]

/* --------------------------------- School form ----------------------------- */

export const schoolForms: SchoolForm[] = [{ id: "form-gkim-sports", patientId: "p-gkim", title: "School sports physical form", requestedBy: "Maple Grove Elementary, youth soccer", createdAt: "2026-10-18T09:30" }]

/* ---------------------------------- Inbox ---------------------------------- */

const chenThread = threads.find((t) => t.id === "t-4066") ?? threads.find((t) => t.assignedToId === "s-chen" && t.unread)!
const unsignedAppts = chenDay.unsigned.map(chenAt)

/** Dr. Chen's review queue: 4 results, 3 refills, 2 notes to sign, 2 messages, 1 form. */
export const inboxSeed: InboxItem[] = [
  { id: "ib-lab-bmp", type: "result", patientId: potassiumPatient, doctorId: CHEN_ID, createdAt: "2026-10-19T10:40", priority: "high", status: "new", summary: "Potassium 5.8 mmol/L, high", refId: "lab-bmp-mwangi" },
  { id: "ib-lab-a1c", type: "result", patientId: chenAt("08:30").patientId, doctorId: CHEN_ID, createdAt: "2026-10-19T12:10", priority: "normal", status: "new", summary: "Hemoglobin A1c 7.4%, down from 7.5%", refId: "lab-a1c-nguyen" },
  { id: "ib-lab-lipid", type: "result", patientId: chenAt("10:30").patientId, doctorId: CHEN_ID, createdAt: "2026-10-18T16:05", priority: "normal", status: "new", summary: "LDL 142 mg/dL, high but improving", refId: "lab-lipid-moreno" },
  { id: "ib-lab-cbc", type: "result", patientId: chenAt("11:00").patientId, doctorId: CHEN_ID, createdAt: "2026-10-19T13:20", priority: "normal", status: "new", summary: "CBC normal", refId: "lab-cbc-mahmoud" },
  ...(["rf-chen-metformin", "rf-chen-levothyroxine", "rf-chen-atorvastatin"] as const).map((id): InboxItem => {
    const r = refillFor(id)
    return { id: `ib-${id}`, type: "refill", patientId: r.patientId, doctorId: CHEN_ID, createdAt: r.createdAt, priority: "normal", status: "new", summary: `${r.medication} ${r.dose} refill request`, refId: r.id }
  }),
  ...unsignedAppts.map((a): InboxItem => ({ id: `ib-note-${a.id}`, type: "note-to-sign", patientId: a.patientId, doctorId: CHEN_ID, createdAt: a.completedAt ?? a.start, priority: "normal", status: "new", summary: `Visit note to sign · ${a.reason}`, refId: a.id })),
  { id: "ib-msg-lily", type: "message", patientId: "p-lily", doctorId: CHEN_ID, createdAt: "2026-10-19T09:05", priority: "normal", status: "done", summary: "Sarah Mitchell: Lily’s cough (replied)", refId: "t-chen-lily-cough" },
  { id: "ib-msg-side-effects", type: "message", patientId: chenThread.patientId, doctorId: CHEN_ID, createdAt: chenThread.lastMessageAt, priority: "normal", status: "new", summary: `${chenThread.subject}`, refId: chenThread.id },
  { id: "ib-form-gkim", type: "form", patientId: "p-gkim", doctorId: CHEN_ID, createdAt: "2026-10-18T09:30", priority: "normal", status: "new", summary: "Sports physical form to sign", refId: "form-gkim-sports" },
]
