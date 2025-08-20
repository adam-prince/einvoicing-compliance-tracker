#!/usr/bin/env node
// Lightweight “refresh” script: for each country in src/data/compliance-data.json
// attempt to enrich specification metadata (version, published date, url).
// NOTE: Without authenticated APIs, we conservatively preserve existing links
// and append placeholders where we cannot verify.

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dataFile = path.join(root, 'src', 'data', 'compliance-data.json');

function isHttp(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

function guessNameFromUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    return host.split('.')[0];
  } catch {
    return 'Specification';
  }
}

function createSpecEntry(name, url) {
  return { name, version: undefined, publishedDate: undefined, url };
}

function updateCountry(country) {
  const b2x = ['b2g', 'b2b', 'b2c'];
  for (const key of b2x) {
    const leg = country.eInvoicing?.[key]?.legislation;
    if (!leg) continue;
    const list = [];
    if (isHttp(leg.specificationLink)) list.push(createSpecEntry(guessNameFromUrl(leg.specificationLink), leg.specificationLink));
    // keep existing if previous run added specs
    if (Array.isArray(leg.specifications)) {
      for (const s of leg.specifications) {
        if (isHttp(s.url) && !list.find(x => x.url === s.url)) list.push(s);
      }
    }
    if (list.length > 0) leg.specifications = list;

    // Ensure mandated/permitted/planned channels have a visible date
    const st = country.eInvoicing?.[key];
    if (st && ['mandated','permitted','planned'].includes(st.status)) {
      if (!st.implementationDate && !st.mandatedDate && !st.legislationFinalisedDate && !st.lastDraftDate && !(Array.isArray(st.phases) && st.phases.length)) {
        st.lastChangeDate = st.lastChangeDate || country.eInvoicing?.lastUpdated || new Date().toISOString();
      }
    }

    // Ensure each declared format points to a canonical specification if missing
    const formats = country.eInvoicing?.[key]?.formats || [];
    for (const f of formats) {
      if (!f) continue;
      if (!isHttp(f.specUrl)) {
        if (f.type === 'UBL') f.specUrl = 'https://docs.oasis-open.org/ubl/os-UBL-2.3/UBL-2.3.html';
        else if (f.type === 'CII') f.specUrl = 'https://unece.org/trade/uncefact/uncefact-cross-industry-invoice';
        else if (f.type === 'Factur-X') f.specUrl = 'https://fnfe-mpe.org/factur-x/factur-x_en/';
        else if ((f.name || '').toLowerCase().includes('peppol')) f.specUrl = 'https://openpeppol.org/what-is-peppol/peppol-specifications/';
      }
    }
  }
}

function main() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    const json = JSON.parse(raw);
    if (!Array.isArray(json)) throw new Error('compliance-data.json not an array');
    json.forEach(updateCountry);
    fs.writeFileSync(dataFile, JSON.stringify(json, null, 2));
    console.log('Refreshed specification metadata (best-effort).');
  } catch (err) {
    console.error('Refresh failed:', err.message);
    process.exit(1);
  }
}

main();


