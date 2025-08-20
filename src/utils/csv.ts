import { Country } from '@types';

export function exportCountriesToCsv(rows: Country[]): string {
	const headers = [
		'id','name','isoCode2','isoCode3','continent','region',
		'b2g_status','b2g_implementationDate','b2b_status','b2b_implementationDate','b2c_status','b2c_implementationDate','lastUpdated'
	];
	const escape = (v: unknown) => {
		if (v === null || v === undefined) return '';
		const s = String(v);
		if (s.includes('"') || s.includes(',') || s.includes('\n')) {
			return '"' + s.replace(/"/g, '""') + '"';
		}
		return s;
	};
	const lines = [headers.join(',')];
	for (const c of rows) {
		lines.push([
			c.id,
			c.name,
			c.isoCode2,
			c.isoCode3,
			c.continent,
			c.region ?? '',
			c.eInvoicing.b2g.status,
			c.eInvoicing.b2g.implementationDate ?? '',
			c.eInvoicing.b2b.status,
			c.eInvoicing.b2b.implementationDate ?? '',
			c.eInvoicing.b2c.status,
			c.eInvoicing.b2c.implementationDate ?? '',
			c.eInvoicing.lastUpdated,
		].map(escape).join(','));
	}
	return lines.join('\n');
}


