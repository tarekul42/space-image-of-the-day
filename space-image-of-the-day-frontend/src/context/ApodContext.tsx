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

  const isInitialMount = React.useRef(true);
  const prevLanguage = React.useRef(language);

  // ─── Initial Hydration from Storage ────────────────────────
  useEffect(() => {
    const hydrate = async () => {
      if (!browser.runtime?.id) {
        setLoading(false);
        isInitialMount.current = false;
        return;
      }
      try {
        const BUFFER_KEY = 'random_buffer';
        const result = await browser.storage.local.get(null);
        
        const buffer = (result[BUFFER_KEY] as any[]) || [];
        if (buffer.length > 0) {
          setApod(buffer[0]);
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        if (result[today]) {
          setApod(result[today] as ApodData);
        }
      } catch (err) {
        console.error('Failed to hydrate from cache', err);
      } finally {
        setLoading(false);
        setTimeout(() => {
          isInitialMount.current = false;
        }, 100);
      }
    };
    hydrate();
  }, []);

  useEffect(() => {
    if (isInitialMount.current) return;

    // Handle Language Change
    if (language !== prevLanguage.current) {
      prevLanguage.current = language;
      localStorage.setItem('userLang', language);
      
      if (browser.runtime?.id && apod) {
        setLoading(true);
        browser.runtime
          .sendMessage({ 
            type: 'UPDATE_TRANSLATION', 
            date: apod.date, 
            lang: language 
          })
          .then((res: any) => {
            if (res?.data) setApod(res.data);
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      }
    }

    // Handle Resolution Preference Change
    localStorage.setItem('allowLowRes', allowLowRes.toString());
  }, [language, allowLowRes, apod]);

  const fetchApod = useCallback(
    async (type: 'FETCH_APOD' | 'FETCH_RANDOM' = 'FETCH_APOD') => {
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
