# Health Scan

Live Link: https://health-scan-puce.vercel.app/

Health Scan is a rule-based food label analyzer built with Next.js, Supabase, and Tesseract.js.

The app extracts ingredient text from product photos, compares content against user-specific health profiles (allergies and chronic conditions), and produces an explainable risk result.

## Highlights

- OCR-based ingredient extraction (`tur+eng`) with confidence check
- User profile driven risk analysis (allergy + disease aware)
- Explainable result cards (risk score, warning reasons, recommendation)
- Anonymous guest mode + email/password auth
- Scan history with edit/delete support
- Supabase-backed API, storage, and row-level security

## Tech Stack

- Next.js (App Router, TypeScript)
- Supabase (Auth, Postgres, Storage)
- Tesseract.js (OCR)
- Tailwind CSS

## Setup

1. Install dependencies

```bash
npm install
```

2. Create local environment file

```bash
cp .env.example .env.local
```

Windows PowerShell alternative:

```powershell
Copy-Item .env.example .env.local
```

3. Fill Supabase keys in `.env.local`.

4. Run SQL scripts in Supabase SQL Editor

- `supabase/schema.sql`
- `supabase/seed.sql`

5. Create a public Supabase Storage bucket named `scan-images`.

6. Enable anonymous sign-in provider in Supabase

- Authentication -> Sign In / Providers -> Anonymous -> Enable

7. Start development server

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Screenshots

### Scan and Analysis UI

![Scan workflow](screenshoots/Ekran%20g%C3%B6r%C3%BCnt%C3%BCs%C3%BC%202026-03-19%20122427.png)

### Risk Dashboard Example 1

![Risk dashboard 1](screenshoots/Ekran%20g%C3%B6r%C3%BCnt%C3%BCs%C3%BC%202026-03-19%20124755.png)

### Risk Dashboard Example 2

![Risk dashboard 2](screenshoots/Ekran%20g%C3%B6r%C3%BCnt%C3%BCs%C3%BC%202026-03-19%20124802.png)

### Risk Dashboard Example 3

![Risk dashboard 3](screenshoots/Ekran%20g%C3%B6r%C3%BCnt%C3%BCs%C3%BC%202026-03-19%20124845.png)

## Notes

- The analysis engine is rule-based and explainable.
- The app does not rely on external LLM APIs.
- If storage upload fails, analysis persistence can still continue.
