import Apod from '../modules/apod/apod.model.js';
const memoryCache = new Map();
/**
 * Initialize the global APOD cache
 * @param {boolean} useMongoDB - Whether to use MongoDB or in-memory cache
 */
export function initCache(useMongoDB) {
    if (useMongoDB) {
        global.apodCache = {
            _model: Apod,
            findOne: async (query) => Apod.findOne(query),
            countDocuments: async () => Apod.countDocuments(),
            findOneRandom: async () => {
                const count = await Apod.countDocuments();
                if (count === 0)
                    return null;
                const random = Math.floor(Math.random() * count);
                return Apod.findOne().skip(random);
            },
            save: async (docData) => {
                const doc = new Apod(docData);
                return doc.save();
            },
            find: async (query, projection, options) => Apod.find(query, projection, options),
        };
    }
    else {
        global.apodCache = {
            _cache: memoryCache,
            findOne: async (query) => {
                const key = query.date;
                return memoryCache.get(key) || null;
            },
            countDocuments: async () => memoryCache.size,
            findOneRandom: async () => {
                const keys = Array.from(memoryCache.keys());
                if (keys.length === 0)
                    return null;
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                return memoryCache.get(randomKey);
            },
            save: async (doc) => {
                memoryCache.set(doc.date, doc);
            },
            find: async (query, projection, options) => {
                let entries = Array.from(memoryCache.values());
                if (options && options.sort) {
                    entries.sort((a, b) => b.date.localeCompare(a.date));
                }
                if (options && options.skip !== undefined && options.limit !== undefined) {
                    entries = entries.slice(options.skip, options.skip + options.limit);
                }
                return entries;
            },
        };
    }
}
