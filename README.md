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

## Licensing

This project is licensed under the MIT License. See `LICENSE` for details.

Third-party licenses are listed in `THIRD-PARTY-NOTICES.md`. When redistributing, include both files and preserve license headers embedded in built artifacts.


