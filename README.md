# Linden Health

A complete healthcare template for a fictional multi-specialty clinic: a marketing site, online booking, a patient portal, a staff admin dashboard and a doctor workspace. Built with Next.js 16, Tailwind CSS 4, shadcn/ui and Motion.

> Linden Health, its doctors, clinics, patients, insurance plans and institutions are all fictional. Every name, number and claim is demo content. Not for clinical use.

Everything runs on typed mock data, so you can clone it and click through every flow with no backend. When you're ready to connect one, each area has a single data layer to swap (see [Connecting a backend](#connecting-a-backend)).

## Demo accounts

Open `/login` and use the demo links under the form (or sign in with an email below and the password `Linden2026!`):

| Link | Email | Who | Lands on |
| --- | --- | --- | --- |
| User portal | `sarah@lindenhealth.example` | Sarah Mitchell, patient (and her family: David, Lily, Noah) | `/portal` |
| Admin portal | `frontdesk@lindenhealth.example` | Taylor Brooks, practice manager | `/admin` |
| Doctor portal | `emily.chen@lindenhealth.example` | Dr. Emily Chen, family medicine | `/admin/my-day` |

In the admin, the account menu switches roles (Admin · Front desk · Doctor). Changes you make in the demo (check-ins, payments, signed notes…) are kept for the browser tab in `sessionStorage`.

## What's inside

The full list, page by page, is in [FEATURES.md](FEATURES.md).

**Marketing site**: home, doctor search with filters, doctor profiles, services, insurance coverage checker and cost estimator, FAQ, branded 404. Links to pages the template doesn't include (About, Careers, Blog, legal) show a "coming soon" toast; the list is in `lib/data/preview.ts`.

**Booking** (`/book`, needs a login): a five-step flow (care → doctor → time → details → review) pre-filled from the signed-in account, with a confirmation, calendar file and directions. Any "Book" link can pre-fill it with `?doctor=`, `?slot=`, `?service=`, `?specialty=`, `?format=`, `?reason=` and `?person=`.

**Patient portal** (`/portal`): overview, visits, lab results with range bars, prescriptions and refills, records, messages, billing and payments, family, settings.

**Staff admin** (`/admin`): overview, schedule (day, week, doctor views), live check-in queue (drag and drop), appointments, patients and full charts, doctors with working hours and time off, three-panel messages, billing (claims, payments, balances, refunds), reports, settings with role-based locks, and a ⌘K command palette.

**Doctor workspace**: My day, a review inbox (results, refills, notes to sign, messages, forms) with undo, and a visit note screen (vitals with range labels, SOAP sections, diagnosis search, orders, prescriptions with allergy checks, sign dialog).

All of it is responsive, keyboard accessible and respects reduced motion.

## Getting started

Requires Node.js 20+ and npm.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # ESLint
```

If `npm run dev` ever serves an old version of a file after you move routes around, stop it, `rm -rf .next` and start it again.

## Stack

- [Next.js 16](https://nextjs.org): App Router, Cache Components, `proxy.ts` for route protection
- [React 19](https://react.dev), TypeScript (strict)
- [Tailwind CSS 4](https://tailwindcss.com) with a single type scale in `app/typography.css`
- [shadcn/ui](https://ui.shadcn.com) on [Base UI](https://base-ui.com), [Hugeicons](https://hugeicons.com)
- [Motion](https://motion.dev), [Recharts](https://recharts.org), [TanStack Table](https://tanstack.com/table)
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev), [date-fns](https://date-fns.org)

## Project structure

```
app/
  (marketing)/   public site (navbar + footer layout)
  (auth)/        log in, sign up
  (booking)/     /book, a focused flow with its own header
  (portal)/      patient portal (sidebar layout)
  (admin)/       staff admin + doctor workspace (sidebar layout, role-aware)
  layout.tsx     root: fonts, toasts, preview-link toasts
  typography.css the type scale: text-display … text-micro
components/
  home/ doctors/ services/ insurance/ booking/ auth/ site/   marketing + booking
  portal/        patient portal
  admin/         staff admin; admin/doctor/ is the doctor workspace
  ui/            shadcn/ui components
lib/
  data/          static content and copy for every page (marketing, portal, admin labels)
  admin/         the admin's mock backend (see below)
  session*.ts    mock session cookie (roles: patient, admin, front-desk, doctor)
  nav/           sidebar navigation per role
proxy.ts         route protection
public/images/   photos (WebP)
```

Conventions: page copy lives in `lib/data/`, never in components; text uses the typography classes (`text-body`, `text-caption`…), not raw sizes; `cn` comes from `@/lib/utils`.

## Connecting a backend

The UI never reads data directly; it goes through one layer per area, so you can replace mocks without touching components.

**Admin and doctor workspace: `lib/admin/`**

| File | Role | Replace with |
| --- | --- | --- |
| `types.ts` | Domain types (Patient, Appointment, Claim, VisitNote, InboxItem…) | Your API or ORM types |
| `seed.ts`, `data.ts`, `clinical.ts` | Deterministic demo data (seeded PRNG) | Your database |
| `queries.ts`, `doctor.ts` (queries) | Async reads. Lists take `{ q, filters, sort, page, pageSize }` and return `{ rows, total, page, pageSize, pageCount, facets }` | `fetch` calls to your API, or server-side DB queries |
| `actions.ts`, `doctor.ts` (mutations) | Writes (check in, book, pay, sign note, approve refill…), each returning a toast message | Server Actions or API calls |
| `store.ts` | Per-tab overrides in `sessionStorage`, so demo changes stick | Remove; your server is the source of truth |

Pages fetch through `useQuery` in `components/admin/hooks.ts`, which re-runs when the store changes. Swap it for your fetching library (for example TanStack Query or SWR) and keep the same query functions.

**Patient portal and marketing: `lib/data/`**

Static, typed content (doctors, plans, Sarah's visits, results, bills…). Replace each export with data from your API; the component props already match those types. The portal's small client stores (`lib/payments.ts`, `lib/read-messages.ts`, `lib/seen-results.ts`) simulate writes in `sessionStorage`.

**Auth: `lib/session.ts`, `lib/session-client.ts`, `lib/session-server.ts`, `proxy.ts`**

The demo session is a plain cookie holding a role. `canAccess(role, path)` in `lib/session.ts` is the single access-control table used by `proxy.ts`. Replace the cookie with your auth provider's session, keep `canAccess` (or move it to your policy layer), and have `proxy.ts` read the real session.

**Time:** the demo is pinned to Monday, Oct 19, 2026, 2:25 PM (`TODAY` and `NOW` in `lib/admin/format.ts`), so waits, schedules and "in 2 days" labels never drift. Use the real clock once you have real data.

## Making it yours

- **Clinic details:** name, phone numbers, hours and locations are in `lib/data/site.ts` and `lib/data/clinics.ts`.
- **Text styles:** change sizes, line heights and weights once in `app/typography.css`.
- **Spacing and surfaces:** section padding, container width and focus styles are in `lib/styles.ts`.
- **Photos:** replace files in `public/images/` and update the paths in `lib/data/`. Doctor portraits are 1200 × 1440; specialty and hero images 2560px wide.

## Deploying

Works on [Vercel](https://vercel.com) with no configuration: import the repo and deploy. No environment variables are needed for the demo.

## Image credits

Photos are from [Pexels](https://www.pexels.com) (free to use under the Pexels license) or generated for this project. Check each image's license before production use, and replace any image that shows real brand names or logos.

## License

[MIT](LICENSE)
