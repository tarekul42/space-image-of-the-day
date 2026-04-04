import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ApodData } from '../types/apod';
import {
  fetchApod as fetchDirect,
  fetchRandomApod as fetchRandomDirect,
} from '../services/apod.service';
import { enrichData } from '../utils/enrichment';
import browser from '../browser';

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
  const [loading, setLoading] = useState(true); // Default to true while we check cache
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('userLang') || 'en';
  });
  const [allowLowRes, setAllowLowRes] = useState<boolean>(() => {
    return localStorage.getItem('allowLowRes') === 'true';
  });

  // ─── Initial Hydration from Storage ────────────────────────
  useEffect(() => {
    const hydrate = async () => {
      if (!browser.runtime?.id) {
        setLoading(false);
        return;
      }
      try {
        const BUFFER_KEY = 'random_buffer';
        const result = await browser.storage.local.get(null);
        
        // Priority 1: Buffer (Random Discovery mode)
        const buffer = (result[BUFFER_KEY] as any[]) || [];
        if (buffer.length > 0) {
          const item = buffer[0];
          setApod(item);
          setLoading(false);
          return;
        }

        // Priority 2: Last cached today's image
        const today = new Date().toISOString().split('T')[0];
        if (result[today]) {
          setApod(result[today] as ApodData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to hydrate from cache', err);
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, []);

  const isInitialMount = React.useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    localStorage.setItem('userLang', language);
    localStorage.setItem('allowLowRes', allowLowRes.toString());
    if (browser.runtime?.id) {
      browser.runtime
        .sendMessage({ type: 'CLEAR_BUFFER', lang: language, allowLowRes })
        .catch(() => {});
    }
  }, [language, allowLowRes]);

  const fetchApod = useCallback(
    async (type: 'FETCH_APOD' | 'FETCH_RANDOM' = 'FETCH_APOD') => {
      // If we already have something from cache, don't show loading spinner for random fetch
      // unless we specifically need to wait.
      if (type === 'FETCH_RANDOM' && apod) {
        // Just send the consume message if we hydrated from buffer
        // Or if we actually want a *new* random image now (e.g. from refresh button)
      }

      setLoading(true);
      setError(null);
      try {
        if (browser.runtime?.id) {
          const response = await browser.runtime.sendMessage({ type, lang: language, allowLowRes });
          const res = response as { data?: ApodData; error?: string };
          if (res.error) throw new Error(res.error);
          setApod(res.data ?? null);
        } else {
          console.warn('Extension runtime not found. Using development fallback.');
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
    [language, allowLowRes, apod],
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
