export interface ApodData {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  copyright?: string;
  object_type?: string;
  constellation?: string;
  more_info_url?: string;
  width?: number;
  height?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  source?: 'cache' | 'api';
}
