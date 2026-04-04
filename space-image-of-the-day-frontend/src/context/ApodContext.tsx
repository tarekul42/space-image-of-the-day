import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ApodData } from '../types/apod';
import {
  fetchApod as fetchDirect,
  fetchRandomApod as fetchRandomDirect,
} from '../services/apod.service';
import { enrichData } from '../utils/enrichment';

interface ApodContextType {
  apod: ApodData | null;
  loading: boolean;
  error: string | null;
  language: string;
  setLanguage: (lang: string) => void;
  allowLowRes: boolean;
  setAllowLowRes: (allow: boolean) => void;
  fetchApod: (type?: 'FETCH_APOD' | 'FETCH_RANDOM') => Promise<void>;
}

const ApodContext = createContext<ApodContextType | undefined>(undefined);

export const ApodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apod, setApod] = useState<ApodData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('userLang') || 'en';
  });
  const [allowLowRes, setAllowLowRes] = useState<boolean>(() => {
    return localStorage.getItem('allowLowRes') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('userLang', language);
    localStorage.setItem('allowLowRes', allowLowRes.toString());
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime
        .sendMessage({ type: 'CLEAR_BUFFER', lang: language, allowLowRes })
        .catch(() => {});
    }
  }, [language, allowLowRes]);

  const fetchApod = useCallback(
    async (type: 'FETCH_APOD' | 'FETCH_RANDOM' = 'FETCH_APOD') => {
      setLoading(true);
      setError(null);
      try {
        // Check if we are running in a Chrome Extension context
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          const response = await chrome.runtime.sendMessage({ type, lang: language, allowLowRes });
          if (response.error) throw new Error(response.error);
          setApod(response.data);
        } else {
          // Fallback for development (localhost:5173)
          console.warn('Chrome runtime not found. Using development fallback.');
          const rawData =
            type === 'FETCH_APOD'
              ? await fetchDirect(undefined, language)
              : await fetchRandomDirect(language);
          const enriched = await enrichData(rawData);
          setApod(enriched);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Signal lost with the cosmos.');
      } finally {
        setLoading(false);
      }
    },
    [language, allowLowRes],
  );

  return (
    <ApodContext.Provider
      value={{
        apod,
        loading,
        error,
        language,
        setLanguage,
        allowLowRes,
        setAllowLowRes,
        fetchApod,
      }}
    >
      {children}
    </ApodContext.Provider>
  );
};

export const useApod = () => {
  const context = useContext(ApodContext);
  if (!context) throw new Error('useApod must be used within an ApodProvider');
  return context;
};
