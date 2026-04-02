import fetch from 'node-fetch';

const SIMBAD_URL = 'https://simbad.cds.unistra.fr/simbad/sim-id';

export interface EnrichedData {
  object_type: string;
  constellation: string;
  more_info_url: string;
}

/**
 * Query SIMBAD database to get astronomical object info
 */
export async function querySimbad(objectName: string): Promise<EnrichedData> {
  if (!objectName || objectName.trim().length < 2) {
    return { object_type: 'Unknown', constellation: 'Unknown', more_info_url: '' };
  }

  try {
    const params = new URLSearchParams({ Ident: objectName });
    const url = `${SIMBAD_URL}?${params.toString()}&NbIdent=1&VOTableExport=on`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SpaceImageOfTheDay/1.0 (educational browser extension)',
      },
    });

    if (!response.ok) {
      return { object_type: 'Celestial Object', constellation: 'Unknown', more_info_url: '' };
    }

    const text = await response.text();

    let objectType = 'Celestial Object';
    const otypeMatch = text.match(/<FIELD\s+name=".*?[Oo]type.*?">\s*(.*?)\s*<\/FIELD>/);
    if (otypeMatch) {
      objectType = otypeMatch[1].trim();
    }

    const otypeDataMatch = text.match(
      /<TD>(G|PN|HII|Cl|Neb|Gal|GCl|QSO|Sy\d?|Blazar|C_star|Star|SNR)[\w.*]*/i,
    );
    if (otypeDataMatch) {
      const code = otypeDataMatch[1].toUpperCase();
      const typeMap: Record<string, string> = {
        G: 'Galaxy',
        PN: 'Planetary Nebula',
        HII: 'HII Region',
        Cl: 'Star Cluster',
        Neb: 'Nebula',
        Gal: 'Galaxy',
        GCl: 'Globular Cluster',
        QSO: 'Quasar',
        BLAZAR: 'Blazar',
        C_STAR: 'Carbon Star',
        STAR: 'Star',
        SNR: 'Supernova Remnant',
      };
      objectType = typeMap[code] || code;
    }

    let constellation = 'Unknown';
    const constellations = [
      'Andromeda',
      'Antlia',
      'Apus',
      'Aquarius',
      'Aquila',
      'Ara',
      'Aries',
      'Auriga',
      'Boötes',
      'Caelum',
      'Camelopardalis',
      'Cancer',
      'Canes Venatici',
      'Canis Major',
      'Canis Minor',
      'Capricornus',
      'Carina',
      'Cassiopeia',
      'Centaurus',
      'Cepheus',
      'Cetus',
      'Chamaeleon',
      'Circinus',
      'Columba',
      'Coma Berenices',
      'Corona Australis',
      'Corona Borealis',
      'Corvus',
      'Crater',
      'Crux',
      'Cygnus',
      'Delphinus',
      'Dorado',
      'Draco',
      'Equuleus',
      'Eridanus',
      'Fornax',
      'Gemini',
      'Grus',
      'Hercules',
      'Horologium',
      'Hydra',
      'Hydrus',
      'Indus',
      'Lacerta',
      'Leo',
      'Leo Minor',
      'Lepus',
      'Libra',
      'Lupus',
      'Lynx',
      'Lyra',
      'Mensa',
      'Microscopium',
      'Monoceros',
      'Musca',
      'Norma',
      'Octans',
      'Ophiuchus',
      'Orion',
      'Pavo',
      'Pegasus',
      'Perseus',
      'Phoenix',
      'Pictor',
      'Pisces',
      'Piscis Austrinus',
      'Puppis',
      'Pyxis',
      'Reticulum',
      'Sagitta',
      'Sagittarius',
      'Scorpius',
      'Sculptor',
      'Scutum',
      'Serpens',
      'Sextans',
      'Taurus',
      'Telescopium',
      'Triangulum',
      'Triangulum Australe',
      'Tucana',
      'Ursa Major',
      'Ursa Minor',
      'Vela',
      'Virgo',
      'Volans',
      'Vulpecula',
    ];

    for (const c of constellations) {
      if (text.toUpperCase().includes(c.toUpperCase())) {
        constellation = c;
        break;
      }
    }

    const moreInfoUrl = `https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${encodeURIComponent(objectName)}`;

    return { object_type: objectType, constellation, more_info_url: moreInfoUrl };
  } catch (error: any) {
    console.error('SIMBAD query error:', error.message);
    return { object_type: 'Celestial Object', constellation: 'Unknown', more_info_url: '' };
  }
}

/**
 * Infer object type from APOD explanation
 */
export function inferFromExplanation(title: string, explanation: string): EnrichedData {
  const combined = `${title} ${explanation}`.toLowerCase();

  let objectType = 'Celestial Object';
  const typeKeywords = [
    {
      keywords: ['galaxy', 'galaxies', 'spiral galaxy', 'elliptical galaxy', 'barred spiral'],
      type: 'Galaxy',
    },
    {
      keywords: ['nebula', 'nebulae', 'planetary nebula', 'emission nebula', 'reflection nebula'],
      type: 'Nebula',
    },
    { keywords: ['supernova', 'supernova remnant'], type: 'Supernova Remnant' },
    {
      keywords: ['star cluster', 'globular cluster', 'open cluster', 'star forming region'],
      type: 'Star Cluster',
    },
    {
      keywords: [
        'planet',
        'jupiter',
        'saturn',
        'mars',
        'venus',
        'mercury',
        'neptune',
        'uranus',
        'pluto',
      ],
      type: 'Planet',
    },
    { keywords: ['moon', 'lunar'], type: 'Moon' },
    { keywords: ['comet', 'asteroid', 'meteor'], type: 'Solar System Object' },
    { keywords: ['aurora'], type: 'Aurora' },
    { keywords: ['pulsar', 'quasar', 'black hole'], type: 'Exotic Object' },
    { keywords: ['constellation'], type: 'Constellation' },
    { keywords: ['milky way', 'andromeda'], type: 'Galaxy' },
    { keywords: ['sun', 'solar'], type: 'Star (Sun)' },
    { keywords: ['star', 'stars'], type: 'Star' },
    { keywords: ['earth', 'international space station', 'iss'], type: 'Earth/Space Station' },
    {
      keywords: ['hubble', 'james webb', 'jwst', 'telescope', 'chandra'],
      type: 'Deep Space Observation',
    },
  ];

  for (const { keywords, type } of typeKeywords) {
    if (keywords.some((kw) => combined.includes(kw))) {
      objectType = type;
      break;
    }
  }

  let constellation = 'Unknown';
  const constellations = [
    'Andromeda',
    'Antlia',
    'Apus',
    'Aquarius',
    'Aquila',
    'Ara',
    'Aries',
    'Auriga',
    'Boötes',
    'Caelum',
    'Camelopardalis',
    'Cancer',
    'Canes Venatici',
    'Canis Major',
    'Canis Minor',
    'Capricornus',
    'Carina',
    'Cassiopeia',
    'Centaurus',
    'Cepheus',
    'Cetus',
    'Corona Borealis',
    'Corvus',
    'Crater',
    'Crux',
    'Cygnus',
    'Delphinus',
    'Dorado',
    'Draco',
    'Eridanus',
    'Fornax',
    'Gemini',
    'Grus',
    'Hercules',
    'Hydra',
    'Leo',
    'Lepus',
    'Libra',
    'Lupus',
    'Lynx',
    'Lyra',
    'Monoceros',
    'Orion',
    'Pavo',
    'Pegasus',
    'Perseus',
    'Phoenix',
    'Pisces',
    'Puppis',
    'Sagittarius',
    'Scorpius',
    'Sculptor',
    'Scutum',
    'Serpens',
    'Taurus',
    'Triangulum',
    'Ursa Major',
    'Ursa Minor',
    'Vela',
    'Virgo',
    'Vulpecula',
  ];

  for (const c of constellations) {
    if (combined.includes(c.toLowerCase())) {
      constellation = c;
      break;
    }
  }

  const moreInfoUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;

  return { object_type: objectType, constellation, more_info_url: moreInfoUrl };
}
