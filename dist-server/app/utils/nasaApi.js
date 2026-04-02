import fetch from 'node-fetch';
const NASA_APOD_URL = 'https://api.nasa.gov/planetary/apod';
/**
 * Fetch the Astronomy Picture of the Day from NASA API
 * @param {string} date - Optional date in YYYY-MM-DD format. Defaults to today.
 * @returns {Promise<ApodData>} APOD data from NASA
 */
export async function fetchApod(date = undefined) {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    const params = new URLSearchParams({
        api_key: apiKey,
    });
    if (date) {
        params.append('date', date);
    }
    const url = `${NASA_APOD_URL}?${params.toString()}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`NASA API error (${response.status}): ${errorText}`);
        }
        const data = (await response.json());
        return data;
    }
    catch (error) {
        console.error('Error fetching NASA APOD:', error.message);
        throw error;
    }
}
/**
 * Fetch a random Astronomy Picture of the Day from NASA API
 * @returns {Promise<ApodData>} Random APOD data from NASA
 */
export async function fetchRandomApod() {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    const params = new URLSearchParams({
        api_key: apiKey,
        count: '1',
    });
    const url = `${NASA_APOD_URL}?${params.toString()}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`NASA API error (${response.status}): ${errorText}`);
        }
        const data = (await response.json());
        return Array.isArray(data) ? data[0] : data;
    }
    catch (error) {
        console.error('Error fetching random NASA APOD:', error.message);
        throw error;
    }
}
/**
 * Parse the APOD title to extract potential astronomical object name
 * @param {string} title - APOD title
 * @returns {string} Potential object name for SIMBAD lookup
 */
export function extractObjectName(title) {
    const name = title
        .replace(/^APOD:\s*/i, '')
        .replace(/^Image of the Day:\s*/i, '')
        .replace(/^\d{4}\s+/i, '')
        .replace(/\s*\[.*?\]\s*/g, '')
        .replace(/\s*\(.*?\)\s*/g, '')
        .replace(/\s*by\s+.*$/i, '')
        .trim();
    const parts = name.split(/[\s:,\-–—]+/).filter(Boolean);
    if (parts.length >= 2) {
        return parts.slice(0, 3).join(' ');
    }
    return name;
}
