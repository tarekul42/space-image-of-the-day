import { ApodData } from '../types/apod';
import { querySimbad } from '../services/simbad.service';

export function extractObjectName(title: string): string {
  const name = title
    .replace(/^APOD:\s*/i, '')
    .replace(/^Image of the Day:\s*/i, '')
    .replace(/^\d{4}\s+/i, '')
    .replace(/\s*\[.*?\]\s*/g, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/\s*by\s+.*$/i, '')
    .trim();

  const parts = name.split(/[\s:,\-–—]+/).filter(Boolean);
  return parts.length >= 2 ? parts.slice(0, 3).join(' ') : name;
}

export function inferFromExplanation(title: string, explanation: string) {
  const combined = `${title} ${explanation}`.toLowerCase();
  const types = [
    { kw: ['galaxy', 'spiral', 'elliptical'], type: 'Galaxy' },
    { kw: ['nebula', 'planetary nebula'], type: 'Nebula' },
    { kw: ['supernova', 'remnant'], type: 'Supernova Remnant' },
    { kw: ['star cluster', 'globular'], type: 'Star Cluster' },
    { kw: ['planet', 'jupiter', 'mars', 'saturn'], type: 'Planet' },
  ];

  let objectType = 'Celestial Object';
  for (const { kw, type } of types) {
    if (kw.some((k) => combined.includes(k))) {
      objectType = type;
      break;
    }
  }

  return { objectType };
}

export async function enrichData(nasaData: ApodData): Promise<ApodData> {
  const objectName = extractObjectName(nasaData.title);
  const simbad = await querySimbad(objectName);
  const inferred = inferFromExplanation(nasaData.title, nasaData.explanation);

  return {
    ...nasaData,
    object_type: simbad?.objectType || inferred.objectType,
    more_info_url:
      simbad?.more_info_url ||
      `https://en.wikipedia.org/wiki/${encodeURIComponent(nasaData.title.replace(/\s+/g, '_'))}`,
  };
}
