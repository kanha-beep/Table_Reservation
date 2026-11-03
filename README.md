# Tablewise

A Next.js + PostgreSQL reservation system for restaurants. It includes a customer booking page, an internal reservations view, and a walk-in waitlist.

## What is included

- Public reservation form: date, time, party size, name, phone number, and booking notes.
- PostgreSQL/Prisma data model: customers, tables, reservations, and waitlist records.
- Staff dashboard: today’s reservations and a live walk-in queue.
- Motion/UI: Tailwind CSS v3, GSAP entrance motion, and Lenis smooth scrolling.
- Security: signed staff session, role-gated waitlist actions, API rate limits, and security headers based on Helmet's protections.
- WhatsApp confirmations: Meta WhatsApp Cloud API support using an approved reservation-template message.

## Run it locally

1. Copy `.env.example` to `.env` and supply your PostgreSQL connection string.
   Also set a unique `AUTH_SECRET` and a strong `STAFF_ACCESS_CODE`.
   To activate WhatsApp confirmations, set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, plus your approved Meta template name and language.
2. Run `npm install`.
3. Run `npm run db:generate`.
4. Run `npm run db:push` to create the PostgreSQL tables.
5. Optionally run `npm run db:seed` to add sample dining tables.
6. Run `npm run dev`, then open `http://localhost:3000`.

## Key files

- `app/page.tsx`: customer reservation experience.
- `app/dashboard/page.tsx`: server-loaded staff dashboard.
- `app/dashboard/AdminDashboard.tsx`: client-side walk-in form and queue updates.
- `app/api/reservations/route.ts`: reservation submission endpoint.
- `app/api/waitlist/route.ts`: walk-in queue endpoint.
- `prisma/schema.prisma`: database schema.
"# Table_Reservation" 
