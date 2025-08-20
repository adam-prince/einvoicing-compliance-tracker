# E‑Invoicing Compliance Tracker

Single-command app to track global e‑invoicing mandates for compliance teams.

## Setup

1. Ensure your UN countries list is placed under:

```
C:\Users\Adam.Prince\OneDrive - Sage Software, Inc\Sage Documents\AI Tools\einvoice-tracker
```

Supported formats: CSV (headers: Name, ISO2, ISO3, Continent, Region) or JSON array with similar keys.

2. Install dependencies and seed data:

```
npm install
npm run seed-data
```

3. Start the dev server:

```
npm run dev
```

## Scripts

- `npm run seed-data` — parses your UN countries file into `src/data/countries.json`.
- `npm run dev` — starts Vite dev server.
- `npm run build` — typecheck and build for production.
- `npm run preview` — preview production build.


