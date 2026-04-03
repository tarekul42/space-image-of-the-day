const SIMBAD_URL = 'https://simbad.cds.unistra.fr/simbad/sim-id';

export interface SimbadResult {
  objectType: string;
  more_info_url: string;
}

export async function querySimbad(objectName: string): Promise<SimbadResult | null> {
  if (!objectName || objectName.trim().length < 2) return null;

  try {
    const params = new URLSearchParams({ Ident: objectName });
    const url = `${SIMBAD_URL}?${params.toString()}&NbIdent=1&VOTableExport=on`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();

    let objectType = 'Celestial Object';
    const otypeDataMatch = text.match(
      /<TD>(G|PN|HII|Cl|Neb|Gal|GCl|QSO|Sy\d?|Blazar|C_star|Star|SNR)[\w.*]*/i,
    );
    if (otypeDataMatch) {
      const typeMap: Record<string, string> = {
        G: 'Galaxy',
        PN: 'Planetary Nebula',
        HII: 'HII Region',
        Cl: 'Star Cluster',
        Neb: 'Nebula',
        Gal: 'Galaxy',
        GCl: 'Globular Cluster',
        QSO: 'Quasar',
        SNR: 'Supernova Remnant',
        STAR: 'Star',
      };
      objectType = typeMap[otypeDataMatch[1].toUpperCase()] || otypeDataMatch[1];
    }

    return { objectType, more_info_url: url };
  } catch {
    return null;
  }
}
