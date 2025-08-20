#!/usr/bin/env node
// Caution: best-effort web updater. Uses heuristics to find official spec pages.
// For production-grade use, replace the heuristics with curated source lists or APIs.

const fs = require('fs');
const path = require('path');
const https = require('https');

const root = process.cwd();
const dataFile = path.join(root, 'src', 'data', 'compliance-data.json');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function guessSources(country) {
  const name = (country.name || '').toLowerCase();
  const sources = [];
  // Heuristics: add official portals per known countries. Extend as needed.
  if (name === 'france') {
    sources.push('https://www.legifrance.gouv.fr/');
    sources.push('https://www.impots.gouv.fr/');
  }
  if (name === 'germany') {
    sources.push('https://xeinkauf.de/xrechnung/');
  }
  if (name === 'spain') {
    sources.push('https://www.facturae.gob.es/');
  }
  if (name === 'belgium') {
    sources.push('https://peppol.org/document-type/peppol-bis/');
    sources.push('https://openpeppol.org/what-is-peppol/peppol-specifications/');
  }
  if (name === 'india') {
    sources.push('https://einvoice.gst.gov.in/');
    sources.push('https://cbic-gst.gov.in/');
  }
  // Always add canonical spec sources for common formats
  sources.push('https://docs.oasis-open.org/ubl/os-UBL-2.3/UBL-2.3.html'); // UBL
  sources.push('https://unece.org/trade/uncefact/uncefact-cross-industry-invoice'); // CII
  sources.push('https://fnfe-mpe.org/factur-x/factur-x_en/'); // Factur-X
  // Default: return existing links so we do not break data
  return sources;
}

function extractVersion(html) {
  const m = html.match(/v(?:ersion)?\s*([0-9]+(?:\.[0-9]+)+)/i);
  return m ? m[1] : undefined;
}

function extractDate(html) {
  const m = html.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/);
  return m ? new Date(m[1]).toISOString() : undefined;
}

async function updateCountry(country) {
  const sources = guessSources(country);
  const targets = ['b2g','b2b','b2c'];
  for (const k of targets) {
    const leg = country.eInvoicing?.[k]?.legislation;
    if (!leg) continue;
    if (!Array.isArray(leg.specifications)) leg.specifications = [];
    for (const url of sources) {
      try {
        const html = await fetchText(url);
        const v = extractVersion(html);
        const d = extractDate(html);
        const name = new URL(url).hostname.replace('www.','');
        if (!leg.specifications.find(s => s.url === url)) {
          leg.specifications.push({ name, version: v, publishedDate: d, url });
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

async function main() {
  const raw = fs.readFileSync(dataFile, 'utf8');
  const json = JSON.parse(raw);
  for (const country of json) {
    await updateCountry(country);
  }
  fs.writeFileSync(dataFile, JSON.stringify(json, null, 2));
  console.log('Best-effort web update complete. Review links/versions before publishing.');
}

main().catch(err => { console.error(err); process.exit(1); });



