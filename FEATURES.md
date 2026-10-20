# Linden Health: every feature

Linden Health is an open-source Next.js 16 template for a fictional multi-specialty clinic with three locations in Greater Cleveland (Cleveland, Lakewood, Beachwood). It has five parts that share one design system and one set of demo data:

1. A **marketing site** for finding doctors, services and insurance answers
2. An **online booking flow**
3. A **patient portal** for the demo family (the Mitchells)
4. A **staff admin dashboard** for the front desk, managers and billing
5. A **doctor workspace** for daily clinical work

Everything is fictional demo data and runs without a backend. It's typed, deterministic and ready to swap for real APIs.

---

## Shared foundation

- **Stack:** Next.js 16 (App Router, Cache Components, `proxy.ts`), React 19, TypeScript (strict), Tailwind CSS 4, shadcn/ui on Base UI, Motion, Recharts, TanStack Table v9, React Hook Form + Zod, date-fns, Hugeicons. npm only.
- **Design system:**
  - One type scale in `app/typography.css`: display, heading, page, title, lead, body, caption and micro, all in DM Sans with optical sizing.
  - Flat white surfaces, hairline borders, rounded panels, and color used only for meaning (green ok, amber attention, red urgent, blue in progress).
- **Content:** every page's copy lives in typed files in `lib/data/`, never in components.
- **Accessibility:**
  - A "Skip to content" link, one main landmark per page and ordered headings.
  - Visible focus rings, keyboard support for menus, tabs, comboboxes and tables, and labelled form fields.
  - Text shown alongside every status color, `aria-live` on toasts and async updates, and reduced-motion support.
  - Touch targets of at least 40px on phones.
- **Responsive:** every page works from 390px phones to large desktops. Tables scroll inside their panel with a sticky first column, or become stacked cards on phones.
- **Toasts:** one toast region for the whole site, with Undo actions where a change can be reversed.
- **Preview links:** links to pages the template doesn't include (About, Careers, Blog, Contact, legal pages) and placeholder links (social, app stores, cookie preferences) show a "coming soon" or "isn't connected yet" toast instead of a 404. The list is in `lib/data/preview.ts`.
- **Error handling:** a branded 404, plus error boundaries with a retry button for the marketing pages, booking, the portal and every admin route.
- **Loading states:** skeletons that match each page's layout.
- **Fixed clock:** the demo is pinned to Monday, Oct 19, 2026, 2:25 PM, so waits, schedules and relative dates never drift.

## Accounts and access

- **Log in** (`/login`):
  - Email and password with validation, and a lockout after 5 wrong tries.
  - "Forgot password" (demo message) and Google / Apple buttons (sign in as the demo patient).
  - Three demo links: **User portal** (Sarah Mitchell), **Admin portal** (Taylor Brooks), **Doctor portal** (Dr. Emily Chen).
  - Each account goes straight to its dashboard, or back to the page it was sent from.
- **Sign up** (`/signup`): create an account, then a 3-step setup covering insurance, family members and a summary with links to book or open the dashboard.
- **Session:** a mock cookie holding the role (patient, admin, front desk or doctor). It's read on the server for the admin sidebar and in the browser for role-aware pages.
- **Route protection** (`proxy.ts` with one access table in `lib/session.ts`):
  - Logged out: `/book`, `/portal` and `/admin` send you to log in.
  - Patients can't open the admin.
  - Doctors can open My day, Inbox, visit notes, Patients, Schedule and Messages; anything else sends them to My day with "You don't have access to that page".
  - Front desk can't open the doctor pages.
- **Navbar:** shows "Log in" when signed out and "Dashboard" (to your role's home) when signed in.

## Marketing site

- **Navbar:** transparent over the hero, then a floating glass pill on scroll. It has primary links, Log in / Dashboard, "Book a visit", and a full-screen menu sheet with Explore links, Patient and Clinic columns, and a call-us line.
- **Home** (`/`):
  - Hero with booking and doctor CTAs and quick facts.
  - Trust strip with institution marks, rating and stats.
  - "How it works" in 3 steps.
  - Specialty showcase that auto-plays, can be paused and is keyboard accessible.
  - Featured doctors.
  - Patient stories with pausable dots.
  - Insurance highlight and self-pay prices.
  - CTA photo band and the footer.
- **Find a doctor** (`/find-a-doctor`):
  - Search across 20 doctors by name, specialty, condition or language.
  - Filters for specialty, clinic, language and available today, plus sorting.
  - Each card shows next open times you can tap to book.
  - Reads `?specialty=` and `?insurance=&plan=`.
- **Doctor profiles** (`/doctors/[slug]`): photo, credentials, languages, training, bio, reviews and FAQs. A booking panel (day and time picker, visit type, reason) sits beside the profile on desktop and as a bottom bar on phones.
- **Services** (`/services`): six specialties (family medicine, pediatrics, women's health, dermatology, cardiology, orthopedics) and extra services (labs, X-ray, vaccines, physical therapy, mental health, nutrition, video visits), with search, category filters and prices.
- **Insurance** (`/insurance`):
  - Coverage checker across 40 plans, by plan, plan type and clinic.
  - Full plan list, a cost estimator, self-pay prices and insurance FAQs.
- **FAQ** (`/faq`): answers grouped by topic, with search and a topic list that follows your scroll. Topic links work directly.
- **Footer:**
  - Newsletter signup with validation, an app download card with QR code, and four link columns (Linden Health, Patients, Company, Health guides).
  - Social links, legal links, and a "fictional clinic" line.

## Booking (`/book`, login required)

A focused page with its own header: logo, a five-step tracker you can click back through, and Exit. A live summary sits on the right on desktop; on phones a bottom bar shows your choices with Back and Continue.

1. **Care:**
   - A grouped dropdown of doctor visits and tests or services, with each option's description.
   - In person or video (video is off for in-person-only services).
   - **Who it's for:** Sarah, David, Lily, Noah (with photos) or "Someone else".
   - An optional note (200 characters).
2. **Doctor:**
   - "First available" or a specific doctor, each with photo, clinic, rating, next opening and whether they take new patients.
   - The patient's own doctor comes first, tagged "Your doctor" or "Noah's doctor".
   - A clinic filter for in-person visits (X-ray is limited to its clinics).
3. **Time:** a day strip and time slots.
4. **Details:**
   - Pre-filled from the account: the patient card, Sarah's email and phone, text reminders, and the insurance on file (Northbridge Health, member ID).
   - "Someone else" asks for name, date of birth and new or returning.
   - Self-pay option.
5. **Review:** every choice, with Edit links and the cancellation policy.

**Confirmation:** a confirmation number and summary, an "Add to calendar" file download, Get directions, Go to patient portal, and Book another visit.

**Pre-fill:** any "Book" link on the site pre-fills the flow with `?doctor=` (id or profile slug), `?slot=`, `?service=`, `?specialty=`, `?format=`, `?reason=` and `?person=`, and starts on the right step. Validation moves focus to the first problem, and each step's heading gets focus when it opens.

## Patient portal (`/portal`, login required)

Signed in as Sarah Mitchell, who manages her family: David (41), Lily (15) and Noah (11). The sidebar collapses to an icon rail with tooltips and becomes a sheet on phones. Its badges update live: new results, unread messages, amount due.

- **Overview:**
  - Greeting, with the family photos in the header.
  - Next visit with get directions.
  - Billing summary card.
  - Health snapshot charts (blood pressure, heart rate, weight, BMI).
  - Recent results with range strips.
  - A "needs attention" table: forms, refills and recalls.
  - Messages preview.
- **Visits:**
  - Upcoming, past and cancelled visits for the whole family, with a person filter.
  - Visit details, pre-visit checklist and forms, reschedule and cancel, and visit summaries with what was billed.
  - Add to calendar.
- **Results:** lab results grouped by panel, with range bars, a plain-language status ("In range", "A little high"), trend charts, the doctor's notes and a printable view. Results you haven't opened are marked new.
- **Prescriptions:** active and past medications per person, with how to take them, side effects and when to call. Refill requests track their progress (requested, approved, ready), and you can change your pharmacy. Allergies are shown too.
- **Records:** health summaries (conditions, allergies), vaccine records (downloadable), documents, and sharing records by email.
- **Messages:** conversations with the care team, the nurse line and billing.
  - Start a new message to the right team.
  - Each team's expected reply time.
  - Attachments.
  - Deep links to a conversation (`?c=`).
- **Billing:**
  - **Overview:**
    - Amount due, due date, paid this year and insurance paid this year.
    - A bills-due table with details for each bill.
    - Pay by card or HSA; the payment updates the badges and cards right away.
    - A "Coverage this year" panel showing the deductible and out-of-pocket max.
  - **Statements:** downloadable.
  - **Payment methods:** add or remove a card, with duplicate check.
  - **Insurance:** plan, member ID, copays and a coverage lookup.
- **Family:** a card for each member with their primary doctor, next visit and status, booking links, and "add a family member" (validated form).
- **Settings:** profile (validated, with date-of-birth picker), notification preferences, security (two-step, devices), privacy and the emergency contact.

## Staff admin dashboard (`/admin`)

The sidebar is grouped into Overview; Front desk (Schedule, Queue, Appointments); Care (Patients, Doctors, Messages); Business (Billing, Reports); and Settings. It shows live counts (people waiting, unread messages).

Throughout the admin:

- **Top bar:** a clinic switcher (All, Cleveland, Lakewood, Beachwood) and a **⌘K command palette** that searches patients (name, MRN, date of birth, phone), appointments, claims, doctors and pages. The palette only shows what your role can open.
- **Account menu:** switch between Admin, Front desk and Doctor, open the portal or the website, and log out.
- **Shared table:**
  - Sortable columns, row selection with bulk actions, a show/hide column menu and a comfortable/compact density toggle.
  - Sticky header and first column, and keyboard row navigation (↑ ↓ Enter).
  - Phone card layout.
  - Search after 300 ms, filters with live counts, date ranges, a "More filters" menu, removable filter chips and Reset.
  - Pagination with 10/25/50/100 rows, "Showing 1–25 of 1,384" and a page-number box.
  - All list state is kept in the URL, so views can be shared and survive a refresh.
- **Patterns:** stat cards with change and sparklines; status badges; patient, doctor, clinic, money and time cells; side sheets for quick views; confirm dialogs; and validated forms.
- **Demo data:** about 2,600 patients, about 11,600 appointments (Aug 20 to Nov 20), about 6,900 claims, about 4,700 payments, 85 message threads, refill requests, 22 providers and 12 staff. All of it is generated deterministically; today's counts are exact (Cleveland 64, Lakewood 52, Beachwood 47).
- **Saved changes:** check-ins, bookings, payments and notes are kept for the browser tab and show up on every page.

The pages:

- **Overview:**
  - Appointments today (compared with last week), checked in, waiting now, and open slots.
  - A live queue table.
  - A 14-day booked vs. completed chart.
  - Up next today.
  - "Needs attention": messages over 24 h, unread messages, new refills, denied claims, forms not done, insurance not verified.
  - Billing this month and recent activity.
- **Schedule:**
  - **Day view:** one column per provider, 7 AM to 8 PM in 15-minute rows.
    - Appointment blocks colored by status, with video icons.
    - Hatched blocks for lunch, huddles and meetings, and grey for hours outside working time.
    - A red "now" line.
    - Click a visit to open it; click an empty slot to book it.
  - **Week view:** provider × day grid with booked/capacity and utilization.
  - **Doctor view:** one provider's next 7 days.
  - Header stats (booked, open, utilization), provider and specialty filters. Phones show one provider at a time.
- **Queue:**
  - A live check-in board: Arrived, Checked in, Waiting, With doctor, Done today.
  - Move cards by drag and drop or with a "Move to…" menu. Moving to "With doctor" asks for a room and greys out rooms in use.
  - Wait timers turn amber after 15 minutes and red after 25. Badges for forms pending, insurance not verified and walk-in.
  - Stats: average and longest wait, patients in clinic, rooms in use.
  - Add a walk-in (existing patient or a quick new one).
  - Refreshes every 30 seconds with a soft highlight on changed cards.
- **Appointments:**
  - Tabs: Today, All, Upcoming, No-shows, Cancelled.
  - Filters: status, provider, clinic, visit type, in person or video, forms, insurance and booked via.
  - Bulk actions: confirm, send reminders, export CSV.
  - Detail sheet with a timeline (booked → confirmed → arrived → checked in → roomed → completed), check in, confirm, no-show, reschedule, cancel with a reason (late-cancel rule), and links to message the patient or open their chart.
  - New appointment: pick the patient, provider, date, an open time slot, visit type, in person or video, and reason.
- **Patients:**
  - Search by name, MRN, date of birth, phone or email.
  - Filters: clinic, primary provider, insurance type, age group, flags, balance, new this month.
  - Bulk message and export CSV.
  - New patient form (validated), which creates an MRN.
- **Patient chart:**
  - **Header:** photo, age and sex, MRN, allergies as red chips and flags. Actions: new appointment, message, edit details, record payment.
  - **Tabs:**
    - Overview, Visits, and Visit notes (read-only full notes).
    - Vitals: charts with normal-range bands; no adult weight or BMI band for children.
    - Results: range bars.
    - Medications and refills, with approve and deny.
    - Billing, Messages, Documents, and Activity (audit log).
  - Sarah's chart matches the portal exactly.
- **Doctors:**
  - Grid or table: specialty, clinics, today's booked/capacity, next open slot, rating, accepting new patients, status.
  - **Doctor page:** profile and leave banner, no-show rate, average visit length, patients on panel, an 8-week utilization chart, and upcoming visits.
    - Weekly hours editor (on/off, clinic, start and end, lunch).
    - Time off (add and remove).
    - Editing is admin only; other roles see disabled controls with a tooltip.
- **Messages:** a three-panel inbox.
  - **Thread list:** search, filters (status, topic, priority, assigned to me, unread), sorting, Load more, an "Over 24 h" badge, and a Refills tab.
  - **Conversation:** quick replies, attachments, and yellow staff-only internal notes.
  - **Patient panel:** next visit, recent results, allergies, balance, plus assign, change status and book.
  - Deep links: `?thread=` and `?patient=`, which also starts a new thread if there isn't one.
- **Billing:**
  - **Stats:** collected this month, outstanding balance, denial rate, average days to pay.
  - **Claims:** filters for status, plan, category, date and amount range; bulk resubmit, mark appealed and export.
    - The claim sheet shows line items, payer response, a timeline and notes, with resubmit, appeal and write off.
  - **Payments:** record a payment (card, HSA, cash or check).
  - **Balances:** aging chart (0–30, 31–60, 61–90, 90+ days) and send statements.
  - **Refunds:** review and issue.
- **Reports:**
  - Date presets (7 days, 30 days, this quarter, custom) and the clinic filter.
  - Key figures compared with the previous period.
  - Charts: appointments over time; no-show and cancellation rates; visits by specialty and by type; average wait by clinic and by hour; revenue billed vs. collected; payer mix; new vs. returning patients; doctor utilization.
  - Charts load as you scroll, and the summary exports to CSV.
- **Settings:**
  - Clinics (hours, rooms, address).
  - Services and prices (inline edit with validation).
  - Insurance plans (turn each on or off).
  - Team and roles (role picker, invite with validation).
  - Notifications (reminder timing rules).
  - Audit log (paged).
  - Front desk sees prices and roles locked, with a tooltip explaining why.
  - Reset demo data.

## Doctor workspace (Dr. Emily Chen)

The doctor sidebar has her photo, name, specialty and clinic at the top, then My day and Inbox (with a "to review" badge), My patients, Schedule (her own column only) and Messages (her own threads only). The footer reads "Demo data. Not for clinical use."

- **My day:**
  - "Good afternoon, Dr. Chen", with a "Running 5 min late" pill worked out from her average visit length.
  - Stats: patients today 16, seen 10, remaining 6, notes to sign 2, inbox items to review.
  - **Now card:** Robert Hayes, 72, Room 2, started 2:04 PM, with Open visit.
  - **Up next card:** Grace Kim, 8, checked in 2 minutes ago, Penicillin allergy chip, with Start visit.
  - **Today timeline:** each visit's time, patient, reason, type, status (Completed, With you, Checked in, Scheduled…), note status (Signed, Unsigned, Not started), and the next action (Open visit, Start visit, Sign note, Join video). It also shows the open slots and a "now" divider.
  - An inbox preview (high priority first), and a pre-visit snapshot for the next patient: last visit, conditions, medications, allergies, vitals and pre-visit form answers.
- **Inbox:**
  - **Tabs with counts:** All, Results, Refills, Notes to sign, Messages, Forms. Sorted high priority first, then oldest; filter by priority; show done items.
  - **Results:** range bars, trends and previous values, plus a red banner for urgent results (potassium 5.8 mmol/L). Actions: mark reviewed (also in bulk), add a note to the patient, order a recheck, message the patient.
  - **Refills:** last filled, last visit and the relevant lab (A1c for metformin, TSH for levothyroxine, lipids for atorvastatin). Approve (quantity and refills), deny (reason required), or "needs visit".
  - **Notes to sign:** opens the visit note.
  - **Messages:** inline reply with quick replies.
  - **Forms:** a preview and Sign form.
  - Every action moves the item to Done with a 5-second Undo.
- **Visit note** (`/admin/visit/[id]`):
  - **Top bar:** patient, age and sex, MRN, time, room, visit type, an "In visit · 21 min" timer, note status, "Saved 2:31 PM", Save draft and Sign note.
  - **Patient panel:** allergies, conditions, medications, last 3 visits, recent results, vitals trends, insurance and pre-visit answers. It's a side panel on desktop and a drawer on smaller screens.
  - **Sections,** each with a "Done" check:
    1. **Vitals:** blood pressure, heart rate, temperature, breathing rate, oxygen, weight, height, pain, with BMI worked out automatically and out-of-range labels in text ("High" for 150/95).
    2. **Subjective:** chief complaint, history and symptom chips.
    3. **Objective:** exam notes, with quick-insert normal templates (General, HEENT, Heart, Lungs, Abdomen, Skin).
    4. **Assessment:** keyboard diagnosis search over about 60 coded diagnoses ("J06.9 · Upper respiratory infection"), shown as removable chips.
    5. **Plan:**
       - Plan text.
       - Orders (lab, imaging, referral, vaccine).
       - Prescriptions with dose, frequency, quantity, refills and pharmacy. A red allergy warning appears for a conflict, such as amoxicillin for a penicillin allergy.
       - Follow-up timing.
    6. **Patient instructions,** in plain language.
  - Autosaves every 10 seconds and when you leave the page. ⌘S saves, ⌘Enter opens the sign dialog.
  - **Sign dialog:** a summary of the note and a list of anything missing (chief complaint and at least one diagnosis are required), plus a confirm checkbox. Signing completes the visit, updates My day and the patient chart, adds new prescriptions to the medication list, and returns to My day.
- **Changes carry across pages:** signing a note, approving a refill or starting a visit updates My day, the inbox, the patient chart, the queue and the admin overview.

## Ready for a backend

- `lib/admin/types.ts` holds every domain type.
- `lib/admin/queries.ts` and `lib/admin/doctor.ts` are the async read layer. Lists take `{ q, filters, sort, page, pageSize }` and return `{ rows, total, page, pageSize, pageCount, facets }`. Swap the bodies for API calls.
- `lib/admin/actions.ts` and the doctor mutations are the write layer; replace them with Server Actions or API calls.
- `lib/admin/store.ts` is the demo-only per-tab persistence; remove it once the server is the source of truth.
- `lib/data/*` holds the static portal and marketing content, typed so that API responses can replace it.
- `lib/session*.ts` and `proxy.ts` are the mock auth with a single access table; plug in a real auth provider here.
- Short comments mark each place a backend call goes (login, sign-up, booking, payments, messages, newsletter, coverage check).

See the [README](README.md) for setup, structure and the integration guide.
