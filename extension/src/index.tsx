import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// ─── Interfaces ──────────────────────────────────────────────
interface ApodData {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl: string;
  media_type: string;
  copyright: string;
  object_type: string;
  constellation: string;
  more_info_url: string;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDelay: number;
  animationDuration: number;
}

// ─── Configuration ───────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';

// ─── Star Field Background Component ─────────────────────────
const StarField: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const generated: Star[] = [];
    for (let i = 0; i < 200; i++) {
      generated.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        animationDelay: Math.random() * 4,
        animationDuration: Math.random() * 3 + 2,
      });
    }
    setStars(generated);
  }, []);

  return (
    <div className="star-field">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={
            {
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${star.animationDelay}s` as any,
              animationDuration: `${star.animationDuration}s` as any,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

// ─── Shooting Star Component ─────────────────────────────────
const ShootingStar: React.FC = () => {
  return (
    <div className="shooting-star-container">
      <div className="shooting-star" />
    </div>
  );
};

// ─── Loading Screen ──────────────────────────────────────────
const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p>Connecting to the cosmos...</p>
    </div>
  );
};

// ─── Error Screen ────────────────────────────────────────────
interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ message, onRetry }) => {
  return (
    <div className="error-container">
      <div className="error-icon">🛸</div>
      <h2 className="error-title">Signal Lost</h2>
      <p className="error-message">{message}</p>
      <button className="retry-button" onClick={onRetry}>
        Reconnect
      </button>
    </div>
  );
};

// ─── Info Badge Component ────────────────────────────────────
interface InfoBadgeProps {
  icon: string;
  label: string;
  value: string;
  link?: string;
}

const InfoBadge: React.FC<InfoBadgeProps> = ({ icon, label, value, link }) => {
  if (!value || value === 'Unknown') return null;

  const content = (
    <div className="info-badge">
      <span className="badge-icon">{icon}</span>
      <div className="badge-content">
        <span className="badge-label">{label}</span>
        <span className="badge-value">{value}</span>
      </div>
    </div>
  );

  return link ? (
    <a href={link} target="_blank" rel="noopener noreferrer" className="info-badge-link">
      {content}
    </a>
  ) : (
    content
  );
};

// ─── Main App Component ──────────────────────────────────────
const App: React.FC = () => {
  const [apod, setApod] = useState<ApodData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [showPanel, setShowPanel] = useState<boolean>(false);

  const fetchApod = useCallback(async () => {
    setLoading(true);
    setError(null);
    setImageLoaded(false);

    try {
      const response = await fetch(`${API_BASE}/apod`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setApod(data);
    } catch (err: any) {
      setError(err.message || 'Failed to reach the backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRandomApod = useCallback(async () => {
    setLoading(true);
    setError(null);
    setImageLoaded(false);
    setShowPanel(false);

    try {
      const response = await fetch(`${API_BASE}/apod/random`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setApod(data);
    } catch (err: any) {
      setError('Failed to fetch a random discovery.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApod();
  }, [fetchApod]);

  if (loading) {
    return (
      <div className="app">
        <StarField />
        <LoadingScreen />
      </div>
    );
  }

  if (error || !apod) {
    return (
      <div className="app">
        <StarField />
        <ErrorScreen message={error || 'Unknown error'} onRetry={fetchApod} />
      </div>
    );
  }

  return (
    <div className="app">
      {/* Background Media */}
      <div className="background-container">
        {apod.media_type === 'image' ? (
          <img
            src={apod.hdurl || apod.url}
            alt={apod.title}
            className={`background-media ${imageLoaded ? 'loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="background-video">
            <iframe
              src={`${apod.url}&autoplay=1&mute=1&loop=1`}
              title={apod.title}
              frameBorder="0"
              allow="autoplay; fullscreen"
            />
          </div>
        )}
        <div className="background-overlay" />
      </div>

      <StarField />
      <ShootingStar />

      {/* Floating UI Trigger */}
      <div className="floating-ui">
        <button
          className={`trigger-button ${showPanel ? 'active' : ''}`}
          onClick={() => setShowPanel(!showPanel)}
        >
          <span className="trigger-icon">{showPanel ? '✕' : '🔭'}</span>
        </button>
      </div>

      {/* Info Panel Overlay */}
      <div className={`info-panel ${showPanel ? 'open' : ''}`}>
        <header className="panel-header">
          <h1 className="panel-title">{apod.title}</h1>
          <div className="panel-date">{apod.date}</div>
        </header>

        <div className="panel-content">
          <div className="info-badges">
            <InfoBadge icon="🔭" label="Object Type" value={apod.object_type} />
            <InfoBadge icon="✨" label="Constellation" value={apod.constellation} />
            {apod.copyright && <InfoBadge icon="©" label="Copyright" value={apod.copyright} />}
          </div>

          <div className="explanation-box">
            <p>{apod.explanation}</p>
          </div>

          {apod.more_info_url && (
            <a
              href={apod.more_info_url}
              target="_blank"
              rel="noopener noreferrer"
              className="more-info-link"
            >
              Learn more on SIMBAD ↗
            </a>
          )}
        </div>

        <footer className="panel-footer">
          <p>Powered by NASA & SIMBAD</p>
          <div className="footer-links">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                fetchRandomApod();
              }}
            >
              Next Discovery
            </a>
          </div>
        </footer>
      </div>

      {/* Hero Title */}
      {!showPanel && (
        <div className="hero-title-container" onClick={() => setShowPanel(true)}>
          <span className="hero-label">COSMIC FEATURE</span>
          <h1 className="hero-title">{apod.title}</h1>
          <div className="hero-interaction-hint">
            <span className="hint-icon">↗</span>
            <span className="hint-text">Click for cosmic details</span>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
