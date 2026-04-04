import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import browser from './browser';

const OptionsPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [cacheSize, setCacheSize] = useState<string>('0 KB');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    browser.storage.sync
      .get(['settings'])
      .then((result: { settings?: { nasaApiKey?: string; reducedMotion?: boolean; highContrast?: boolean } }) => {
        if (result.settings) {
          setApiKey(result.settings.nasaApiKey || '');
          setReducedMotion(result.settings.reducedMotion || false);
          setHighContrast(result.settings.highContrast || false);
        }
      });

    calculateCacheSize();
  }, []);

  const calculateCacheSize = () => {
    browser.storage.local.getBytesInUse(null).then((bytes: number) => {
      setCacheSize(`${(bytes / 1024).toFixed(2)} KB`);
    });
  };

  const handleSave = () => {
    browser.storage.sync
      .set({
        settings: {
          nasaApiKey: apiKey,
          reducedMotion,
          highContrast,
        },
      })
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      });
  };

  const clearCache = () => {
    if (confirm('Clear all locally cached astronomical images and metadata?')) {
      browser.storage.local.clear().then(() => {
        calculateCacheSize();
      });
    }
  };

  return (
    <div className={`app options-container ${highContrast ? 'high-contrast' : ''}`}>
      <div className="options-glass">
        <header className="options-header">
          <h1>Cosmic Settings</h1>
          <p>Personalize your window to the universe.</p>
        </header>

        <section className="options-section">
          <h2>📡 Connection</h2>
          <div className="option-item">
            <label htmlFor="apiKey">NASA API Key</label>
            <input
              id="apiKey"
              type="password"
              placeholder="DEMO_KEY"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="hint">
              Using your own key avoids strict rate limits.
              <a href="https://api.nasa.gov/" target="_blank">
                Get one here ↗
              </a>
            </p>
          </div>
        </section>

        <section className="options-section">
          <h2>🎨 Appearance</h2>
          <div className="option-item toggle-item">
            <label>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
              />
              Reduced Motion
            </label>
          </div>
          <div className="option-item toggle-item">
            <label>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
              />
              High Contrast Text
            </label>
          </div>
        </section>

        <section className="options-section">
          <h2>💾 Data & Privacy</h2>
          <div className="option-item">
            <div className="cache-info">
              <span>
                Local Cache: <strong>{cacheSize}</strong>
              </span>
              <button className="text-button" onClick={clearCache}>
                Clear Cache
              </button>
            </div>
          </div>
        </section>

        <footer className="options-footer">
          <button className="save-button" onClick={handleSave}>
            {saved ? 'Settings Saved! ✨' : 'Save Preferences'}
          </button>
          <div className="about-links">
            <a href="https://github.com/tarekul42/space-image-of-the-day" target="_blank">
              GitHub
            </a>{' '}
            •<span> v1.1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<OptionsPage />);
}
