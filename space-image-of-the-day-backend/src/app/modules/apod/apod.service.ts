import axios from "axios";
import { env } from "../../config/env.js";
import redisClient from "../../config/redis.config.js";
import logger from "../../utils/logger.js";
import { IApodData } from "./apod.interface.js";
import translate from "google-translate-api-x";

const NASA_APOD_URL = "https://api.nasa.gov/planetary/apod";
const CACHE_KEY_PREFIX = "apod:";

/**
 * Fetch Astronomical Picture of the Day.
 * Checks cache first, then calls NASA API.
 */
const getApodByDate = async (
  date?: string,
  lang?: string,
): Promise<{ data: IApodData; source: "cache" | "api" }> => {
  const targetDate = date || new Date().toISOString().split("T")[0];
  const targetLang = lang || "en";
  const cacheKey = `${CACHE_KEY_PREFIX}${targetLang}:${targetDate}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`🎯 Cache Hit for APOD: ${targetDate} (${targetLang})`);
      return { data: JSON.parse(cachedData), source: "cache" };
    }
  } catch (err) {
    logger.error(err instanceof Error ? err : { err }, "Redis fetch error");
  }

  logger.info(`🌐 Fetching APOD from NASA for: ${targetDate}`);
  const response = await axios.get<IApodData>(NASA_APOD_URL, {
    params: {
      api_key: env.NASA_API_KEY,
      date: targetDate,
    },
  });

  let data = response.data;

  if (targetLang !== "en") {
    try {
      logger.info(`🌎 Translating APOD to ${targetLang}`);
      const [titleRes, expRes] = await Promise.all([
        translate(data.title, { to: targetLang }),
        translate(data.explanation, { to: targetLang })
      ]);
      data = { ...data, title: titleRes.text, explanation: expRes.text };
    } catch (err) {
      logger.error(err instanceof Error ? err : { err }, "Translation failed, falling back to English");
    }
  }

  // Enriched data simulation (matching the reference logic)
  const isGalaxy = data.explanation.toLowerCase().includes("galaxy");
  const isNebula = data.explanation.toLowerCase().includes("nebula");
  const isCluster = data.explanation.toLowerCase().includes("cluster");

  const enrichedData: IApodData = {
    ...data,
    object_type: isGalaxy
      ? "Galaxy"
      : isNebula
        ? "Nebula"
        : isCluster
          ? "Star Cluster"
          : "Celestial Object",
    constellation: "Unknown Constellation",
    more_info_url: `https://simbad.u-strasbg.fr/simbad/sim-basic?Ident=${encodeURIComponent(data.title)}`,
  };

  try {
    await redisClient.set(cacheKey, JSON.stringify(enrichedData), {
      EX: 86400, // 24 hours
    });
  } catch (err) {
    logger.error(err instanceof Error ? err : { err }, "Redis save error");
  }

  return { data: enrichedData, source: "api" };
};

const getRandomApod = async (lang: string = "en"): Promise<{ data: IApodData; source: "api" | "cache" }> => {
  const targetLang = lang;
  logger.info("🎲 Fetching random APOD from NASA");

  let attempts = 0;
  while (attempts < 3) {
    const response = await axios.get<IApodData | IApodData[]>(NASA_APOD_URL, {
      params: {
        api_key: env.NASA_API_KEY,
        count: 5,
      },
    });

    const items = Array.isArray(response.data) ? response.data : [response.data];
    const imageItems = items.filter(item => item.media_type === "image");

    if (imageItems.length > 0) {
      // Logic: Cache all retrieved images to Redis to reduce future latency, 
      // but return the first one immediately.
      const firstItem = imageItems[0];
      
      // We essentially "prime" the cache for these dates/langs
      for (const item of imageItems) {
        // We use the same getApodByDate logic to enrich and cache
        // but we don't await the others to avoid delaying the response.
        getApodByDate(item.date, targetLang).catch(() => {}); 
      }

      // Re-fetch the first one through the standard cached method 
      // to ensure consistency and enrichment.
      return await getApodByDate(firstItem.date, targetLang);
    }

    attempts++;
    logger.warn("No image found in random APOD fetch, retrying...");
  }

  throw new Error("Failed to find a random image APOD after several attempts");
};

export const ApodService = {
  getApodByDate,
  getRandomApod,
};
