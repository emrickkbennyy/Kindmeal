import React, { useState } from 'react';
import { useRescue } from '../context/RescueContext';
import {
  Utensils,
  MapPin,
  Clock,
  CheckCircle2,
  Filter,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function AvailableFoodPage() {
  const { foodListings, openRequestModal, queue, availableMeals, availablePacks, setActivePage } = useRescue();
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    { id: 'ALL', label: 'All Listings' },
    { id: 'Cooked Meals', label: 'Cooked Meals' },
    { id: 'Bakery Items', label: 'Bakery Items' },
    { id: 'Packaged Meals', label: 'Packaged Meals' }
  ];

  const filteredListings =
    selectedCategory === 'ALL'
      ? foodListings
      : foodListings.filter((item) => item.category === selectedCategory);

  return (
    <div className="available-food-page animate-fade-in">
      {/* Page Header */}
      <section className="page-header-section">
        <div className="container">
          <div className="page-header-flex">
            <div>
              <h1 className="page-title">Available Food</h1>
              <p className="page-subtitle">
                Fresh surplus food from verified kitchens, ready for fair rescue.
              </p>
            </div>

            {/* Quick Live Summary Badge */}
            <div className="header-summary-card">
              <div className="summary-metric">
                <span className="metric-num">{availableMeals}</span>
                <span className="metric-label">Meals Available</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-metric">
                <span className="metric-num">{availablePacks}</span>
                <span className="metric-label">Bakery Packs</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-metric">
                <span className="metric-num">{queue.length}</span>
                <span className="metric-label">NGOs in Queue</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setActivePage('queue');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <span>View Queue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="category-filter-bar">
            <span className="filter-label">
              <Filter size={15} /> Filter:
            </span>
            <div className="filter-pills-list">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`filter-pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                  {cat.id === 'ALL' && (
                    <span className="pill-count">{foodListings.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Food Listings Grid (3 Cards Per Row on Desktop) */}
      <section className="food-grid-section">
        <div className="container">
          {filteredListings.length === 0 ? (
            <div className="empty-listings-box card" style={{ padding: '48px', textAlign: 'center', background: '#fff' }}>
              <AlertCircle size={36} className="text-muted" style={{ margin: '0 auto 12px' }} />
              <h3>No Food Listings Found</h3>
              <p>There are no surplus listings matching the category "{selectedCategory}".</p>
              <button className="btn btn-secondary btn-sm mt-3" onClick={() => setSelectedCategory('ALL')}>
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="food-listings-grid">
              {filteredListings.map((item) => {
                const isOutOfStock = item.quantity <= 0;

                return (
                  <div
                    key={item.id}
                    className={`food-card card ${isOutOfStock ? 'out-of-stock-card' : ''}`}
                    id={`card-${item.id}`}
                    style={isOutOfStock ? { opacity: 0.75 } : {}}
                  >
                    {/* Card Header */}
                    <div className="food-card-header">
                      <span className="badge badge-neutral">{item.category}</span>
                      {isOutOfStock ? (
                        <span className="badge badge-neutral" style={{ color: '#991B1B', background: '#FEE2E2' }}>
                          RESCUED / ZERO STOCK
                        </span>
                      ) : (
                        <span className="badge badge-green available-badge">
                          <span className="badge-pulse-dot"></span>
                          AVAILABLE
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="food-card-body">
                      <div className="food-donor-row">
                        <h3 className="food-donor-title">{item.donor}</h3>
                        <span className="food-location-tag">
                          <MapPin size={13} /> {item.location}
                        </span>
                      </div>

                      {/* Quantity Highlight */}
                      <div className="food-quantity-badge">
                        <span className="quantity-number">{item.quantity}</span>
                        <span className="quantity-unit">{item.unit} available</span>
                      </div>

                      {/* Description */}
                      <p className="food-description">{item.description}</p>

                      {/* Dietary Note & Deadline */}
                      <div className="food-meta-row">
                        <div className="food-meta-item">
                          <Sparkles size={13} className="text-accent" />
                          <span>{item.dietary}</span>
                        </div>
                        <div className="food-meta-item">
                          <Clock size={13} className="text-secondary" />
                          <span>{item.deadline}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Action */}
                    <div className="food-card-footer">
                      <button
                        className={`btn ${isOutOfStock ? 'btn-secondary' : 'btn-primary'} w-full request-food-btn`}
                        onClick={() => openRequestModal(item)}
                        disabled={isOutOfStock}
                        id={`request-btn-${item.id}`}
                      >
                        <Utensils size={16} />
                        <span>{isOutOfStock ? 'Stock Exhausted' : 'Request Food'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Information Notice */}
          <div className="listings-bottom-note">
            <div className="bottom-note-inner">
              <CheckCircle2 size={18} className="text-secondary flex-shrink-0" />
              <div>
                <strong>Safe food handling protocols observed:</strong> All food donors follow food safety hygiene guidelines. Cooked meals must be collected within insulated carriers to preserve freshness.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
