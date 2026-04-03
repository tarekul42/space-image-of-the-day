export interface IApodData {
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: "image" | "video" | string;
  service_version: string;
  title: string;
  url: string;
  copyright?: string;
  // Enrichment data (simulation of Simbad)
  object_type?: string;
  constellation?: string;
  more_info_url?: string;
}

export interface IApodResponse {
  data: IApodData;
  source: "api" | "cache";
}
