import { fetchApod, fetchRandomApod } from '../../utils/nasaApi.js';
import { enrichApodData } from './apod.service.js';
/**
 * Format APOD document for API response
 */
const formatApodResponse = (apod) => {
    return {
        date: apod.date,
        title: apod.title,
        explanation: apod.explanation,
        url: apod.url,
        hdurl: apod.hdurl,
        media_type: apod.media_type,
        copyright: apod.copyright || '',
        object_type: apod.object_type,
        constellation: apod.constellation,
        more_info_url: apod.more_info_url,
    };
};
/**
 * Get APOD by date (defaults to today)
 */
export const getApodByDate = async (req, res) => {
    try {
        const { date } = req.query;
        const cacheKey = date || new Date().toISOString().split('T')[0];
        const cached = await global.apodCache.findOne({ date: cacheKey });
        if (cached) {
            console.log(`[Cache Hit] Returning cached APOD for ${cacheKey}`);
            return res.json(formatApodResponse(cached));
        }
        console.log(`[Cache Miss] Fetching APOD for ${cacheKey} from NASA...`);
        const nasaData = await fetchApod(date);
        const existing = await global.apodCache.findOne({ date: nasaData.date });
        if (existing)
            return res.json(formatApodResponse(existing));
        const enriched = await enrichApodData(nasaData);
        const apodDoc = {
            ...nasaData,
            ...enriched,
            hdurl: nasaData.hdurl || nasaData.url,
        };
        await global.apodCache.save(apodDoc);
        res.json(formatApodResponse(apodDoc));
    }
    catch (error) {
        console.error('[Controller: getApodByDate]', error.message);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};
/**
 * Get a random APOD
 */
export const getRandomApod = async (req, res) => {
    try {
        console.log('[NASA] Fetching random APOD...');
        const nasaData = await fetchRandomApod();
        const cached = await global.apodCache.findOne({ date: nasaData.date });
        if (cached)
            return res.json(formatApodResponse(cached));
        const enriched = await enrichApodData(nasaData);
        const apodDoc = {
            ...nasaData,
            ...enriched,
            hdurl: nasaData.hdurl || nasaData.url,
        };
        await global.apodCache.save(apodDoc);
        res.json(formatApodResponse(apodDoc));
    }
    catch (error) {
        console.error('[Controller: getRandomApod]', error.message);
        res.status(500).json({ error: 'Failed to fetch random APOD' });
    }
};
/**
 * Get discovery history
 */
export const getApodHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const entries = await global.apodCache.find({}, null, {
            sort: { date: -1 },
            skip: (page - 1) * limit,
            limit,
        });
        const total = await global.apodCache.countDocuments();
        res.json({
            entries,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        console.error('[Controller: getApodHistory]', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
