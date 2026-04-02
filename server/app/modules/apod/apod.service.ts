import { querySimbad, inferFromExplanation, EnrichedData } from '../../utils/simbad.js';
import { extractObjectName, ApodData } from '../../utils/nasaApi.js';

/**
 * Enrich NASA APOD data with SIMBAD astronomical info
 * @param {ApodData} nasaData - Raw data from NASA API
 * @returns {Promise<EnrichedData>} Enriched astronomical data
 */
export async function enrichApodData(nasaData: ApodData): Promise<EnrichedData> {
  let enriched: EnrichedData = {
    object_type: 'Unknown',
    constellation: 'Unknown',
    more_info_url: '',
  };

  try {
    const objectName = extractObjectName(nasaData.title);
    const simbadData = await querySimbad(objectName);
    const inferred = inferFromExplanation(nasaData.title, nasaData.explanation);

    if (simbadData.object_type === 'Celestial Object') {
      enriched = inferred;
    } else {
      enriched = {
        object_type: simbadData.object_type,
        constellation:
          simbadData.constellation !== 'Unknown'
            ? simbadData.constellation
            : inferred.constellation,
        more_info_url: simbadData.more_info_url || inferred.more_info_url,
      };
    }
  } catch (enrichError: any) {
    console.warn(
      '[Enrichment] SIMBAD failed, falling back to text inference:',
      enrichError.message,
    );
    enriched = inferFromExplanation(nasaData.title, nasaData.explanation);
  }

  return enriched;
}
