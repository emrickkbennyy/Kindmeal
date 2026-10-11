import React from 'react';
import { useRescue } from '../context/RescueContext';
import { RotateCcw } from 'lucide-react';

export default function Footer() {
  const { setActivePage, resetDemo, queue, availableMeals, availablePacks } = useRescue();

  return (
    <footer className="footer-wrapper">
      <div className="container footer-container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <div className="footer-brand">
              <span className="brand-title">KINDMEAL</span>
              <span className="brand-tagline">Rescue food. Serve communities.</span>
            </div>
            <p className="footer-desc">
              KindMeal connects surplus food from local donors with NGOs and community organizations through a simple, transparent first-come-first-served rescue system.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Navigation</h4>
            <ul className="footer-links">
              <li>
                <button onClick={() => { setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => { setActivePage('available'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  Available Food
                </button>
              </li>
              <li>
                <button onClick={() => { setActivePage('queue'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  Rescue Queue
                </button>
              </li>
            </ul>
          </div>

          {/* Live Status & Quick Action */}
          <div className="footer-state-col">
            <h4 className="footer-col-title">Platform Status</h4>
            <div className="footer-stats-box">
              <div className="footer-stat-row">
                <span>Available Food:</span>
                <strong>{availableMeals} meals + {availablePacks} packs</strong>
              </div>
              <div className="footer-stat-row">
                <span>Requests Waiting:</span>
                <strong>{queue.length} in queue</strong>
              </div>
            </div>
            <button
              onClick={resetDemo}
              className="btn btn-secondary btn-sm footer-reset-btn"
              title="Reset demonstration state back to initial values"
            >
              <RotateCcw size={14} />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} KindMeal — Rescue food. Serve communities.</p>
          <p className="footer-meta">
            Transparent surplus food allocation powered by FIFO Queue
          </p>
        </div>
      </div>
    </footer>
  );
}
