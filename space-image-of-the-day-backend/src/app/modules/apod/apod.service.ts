import axios from "axios";
import { env } from "../../config/env.js";
import redisClient from "../../config/redis.config.js";
import logger from "../../utils/logger.js";
import { IApodData } from "./apod.interface.js";

const NASA_APOD_URL = "https://api.nasa.gov/planetary/apod";
const CACHE_KEY_PREFIX = "apod:";

/**
 * Fetch Astronomical Picture of the Day.
 * Checks cache first, then calls NASA API.
 */
const getApodByDate = async (
  date?: string,
): Promise<{ data: IApodData; source: "cache" | "api" }> => {
  const targetDate = date || new Date().toISOString().split("T")[0];
  const cacheKey = `${CACHE_KEY_PREFIX}${targetDate}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`🎯 Cache Hit for APOD: ${targetDate}`);
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

  const data = response.data;

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

const getRandomApod = async (): Promise<{ data: IApodData; source: "api" }> => {
  logger.info("🎲 Fetching random APOD from NASA");
  const response = await axios.get<IApodData>(NASA_APOD_URL, {
    params: {
      api_key: env.NASA_API_KEY,
      count: 1,
    },
  });

  // @ts-expect-error NASA API response type mismatch
  const data = response.data[0] || response.data;
  return { data, source: "api" };
};

export const ApodService = {
  getApodByDate,
  getRandomApod,
};
