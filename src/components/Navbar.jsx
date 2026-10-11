import React, { useState } from 'react';
import { useRescue } from '../context/RescueContext';
import { Layers, Menu, X, ArrowRight, Utensils, HeartHandshake } from 'lucide-react';

export default function Navbar() {
  const { activePage, setActivePage, queue, availableMeals, availablePacks, openRequestModal, foodListings } = useRescue();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'available', label: 'Available Food' },
    {
      id: 'queue',
      label: 'Rescue Queue',
      badge: queue.length
    }
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="navbar-wrapper">
      <div className="container navbar-container">
        {/* Brand Logo & Tagline */}
        <button
          className="brand-link"
          onClick={() => handleNavClick('home')}
          aria-label="KindMeal Home"
        >
          <div className="brand-logo-icon">
            {/* Custom crafted plate + sprout leaf SVG symbol */}
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="logo-svg"
            >
              <circle cx="16" cy="16" r="14" fill="#183B2B" />
              <path
                d="M8 18C8 22.4183 11.5817 26 16 26C20.4183 26 24 22.4183 24 18H8Z"
                fill="#2D6A4F"
              />
              <path
                d="M16 8C16 8 13 11 13 14C13 15.6569 14.3431 17 16 17C17.6569 17 19 15.6569 19 14C19 11 16 8 16 8Z"
                fill="#FDF1EB"
              />
              <path
                d="M16 11C18 9 21.5 9.5 22 12C22 14.5 19.5 15.5 16 15"
                stroke="#D96B43"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">KINDMEAL</span>
            <span className="brand-tagline">Rescue food. Serve communities.</span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                id={`nav-${item.id}`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`nav-badge ${isActive ? 'nav-badge-active' : ''}`}
                    title={`${item.badge} requests in queue`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Status Pill & Quick Action */}
        <div className="navbar-actions">
          <div className="live-status-pill" title="Live surplus food ready for allocation">
            <span className="status-dot"></span>
            <span className="status-text">
              <strong>{availableMeals}</strong> meals · <strong>{availablePacks}</strong> packs
            </span>
          </div>

          <button
            className="btn btn-primary btn-sm nav-cta-btn"
            onClick={() => {
              if (activePage !== 'available') {
                setActivePage('available');
              }
              openRequestModal(foodListings[0]);
            }}
          >
            <Utensils size={15} />
            <span>Request Food</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer animate-fade-in">
          <div className="container mobile-menu-content">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`mobile-nav-item ${activePage === item.id ? 'active' : ''}`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="badge badge-green">{item.badge} waiting</span>
                )}
              </button>
            ))}
            <div className="mobile-menu-footer">
              <button
                className="btn btn-primary w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActivePage('available');
                  openRequestModal(foodListings[0]);
                }}
              >
                <Utensils size={16} />
                <span>Request Food Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
