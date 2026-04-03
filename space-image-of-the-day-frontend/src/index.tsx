import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tailwind.css';
import { ApodProvider, useApod } from './context/ApodContext';
import { StarField } from './Components/Discovery/StarField';
import { ApodDisplay } from './Components/Discovery/ApodDisplay';

const App: React.FC = () => {
  const { fetchApod } = useApod();

  useEffect(() => {
    fetchApod();
  }, [fetchApod]);

  return (
    <div className="relative w-full h-full min-h-screen">
      <StarField />
      <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center">
        <ApodDisplay />
      </main>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ApodProvider>
        <App />
      </ApodProvider>
    </React.StrictMode>,
  );
}
