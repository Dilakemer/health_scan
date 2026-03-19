# Health Scan MVP

Rule-based health product scanner built with Next.js, Supabase, and Tesseract.js.

## Setup

1. Install dependencies:
	`npm install`
2. Copy environment file:
	`cp .env.example .env.local`
3. Fill Supabase keys in `.env.local`.
4. Apply SQL in Supabase SQL editor:
	- `supabase/schema.sql`
	- `supabase/seed.sql`
5. Create a public Supabase storage bucket named `scan-images`.
6. In Supabase, enable Anonymous provider:
   - Authentication -> Sign In / Providers -> Anonymous -> Enable
7. Run project:
	`npm run dev`

## Implemented Scope

- Email/password auth with protected routes
- Guest mode with Supabase anonymous auth (no email rate-limit dependency)
- Profile CRUD API and dashboard profile editor
- OCR pipeline (`tur+eng`) with confidence threshold
- Ingredient parser and rule engine
- Analyze API with DB-backed per-user rate limiting (`10/min`)
- Scan history persistence and dashboard listing

## Notes

- This project uses rule-based matching and does not use external AI APIs.
- Storage upload failures do not block analysis result persistence.
