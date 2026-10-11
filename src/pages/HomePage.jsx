import React from 'react';
import { useRescue } from '../context/RescueContext';
import {
  ArrowRight,
  ArrowDown,
  Utensils,
  Layers,
  HeartHandshake,
  CheckCircle,
  Building2,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function HomePage() {
  const { setActivePage, availableMeals, availablePacks, queue, processedHistory } = useRescue();

  return (
    <div className="home-page animate-fade-in">
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            {/* Hero Copy */}
            <div className="hero-content">
              <div className="hero-badge-pill">
                <span className="pill-dot"></span>
                <span>Community Food Rescue Network</span>
              </div>

              <h1 className="hero-headline">
                Good food deserves a <span className="headline-accent">second destination.</span>
              </h1>

              <p className="hero-supporting">
                KindMeal connects surplus food from local donors with NGOs and community organizations through a simple, transparent First-In, First-Out (FIFO) rescue system.
              </p>

              <div className="hero-cta-group">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => {
                    setActivePage('available');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  id="hero-explore-cta"
                >
                  <Utensils size={18} />
                  <span>Explore Available Food</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => {
                    setActivePage('queue');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  id="hero-queue-cta"
                >
                  <Layers size={18} />
                  <span>View Rescue Queue</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="hero-trust-indicators">
                <div className="trust-item">
                  <CheckCircle size={16} className="text-secondary" />
                  <span>Strict FIFO Queue Discipline</span>
                </div>
                <div className="trust-item">
                  <CheckCircle size={16} className="text-secondary" />
                  <span>Zero Perishable Food Waste</span>
                </div>
                <div className="trust-item">
                  <CheckCircle size={16} className="text-secondary" />
                  <span>Verified Community Kitchens</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Composition */}
            <div className="hero-visual-col">
              <div className="hero-card-stack">
                <div className="hero-image-frame">
                  <img
                    src="/images/hero-community.jpg"
                    alt="Volunteers sharing wholesome rescued meals with community members"
                    className="hero-main-img"
                  />
                  <div className="hero-image-overlay"></div>
                </div>

                {/* Floating Real-Time Queue Status Card */}
                <div className="floating-queue-badge">
                  <div className="floating-badge-header">
                    <span className="live-indicator-dot"></span>
                    <span className="floating-badge-title">Live Dispatch Status</span>
                    <span className="badge badge-green ml-auto">FIFO Active</span>
                  </div>
                  <div className="floating-badge-body">
                    <div className="queue-mini-item front">
                      <span className="mini-pos">#1 FRONT</span>
                      <span className="mini-name">
                        {queue.length > 0 ? queue[0].ngoName : 'Queue Empty'}
                      </span>
                      <span className="mini-qty">
                        {queue.length > 0 ? `${queue[0].mealsRequested} ${queue[0].unit || 'meals'}` : '0 pending'}
                      </span>
                    </div>
                    <div className="queue-mini-source">
                      <span>From:</span> <strong>{queue.length > 0 ? queue[0].donorName : 'All served'}</strong>
                    </div>
                    <div className="queue-mini-meta">
                      <span><strong>{availableMeals}</strong> meals + <strong>{availablePacks}</strong> packs</span>
                      <span><strong>{queue.length}</strong> in line</span>
                    </div>
                  </div>
                </div>

                {/* Floating Callout Badge */}
                <div className="floating-stat-pill">
                  <HeartHandshake size={22} className="text-accent" />
                  <div>
                    <strong>100% Edible Surplus</strong>
                    <p>Fair, transparent redirection</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMPACT LIVE STATISTICS (From Backend SQLite) */}
      <section className="impact-section" style={{ paddingTop: '24px', paddingBottom: '32px' }}>
        <div className="container">
          <div className="impact-inner">
            <div className="section-header impact-header" style={{ marginBottom: '24px' }}>
              <span className="section-label">Live Platform Statistics</span>
              <h2 className="section-title">Real-Time Rescue Metrics</h2>
              <p className="section-subtitle">
                Current inventory and queue state retrieved directly from the backend database.
              </p>
            </div>

            <div className="impact-stats-grid">
              <div className="stat-card">
                <div className="stat-value">{availableMeals}</div>
                <div className="stat-label">Surplus Meals Available</div>
                <p className="stat-description">
                  Fresh cooked & packaged meals across canteen and restaurant partners.
                </p>
              </div>

              <div className="stat-card">
                <div className="stat-value">{availablePacks}</div>
                <div className="stat-label">Bakery Packs Available</div>
                <p className="stat-description">
                  Fresh sealed baked bread and pastry packs from bakery donors.
                </p>
              </div>

              <div className="stat-card">
                <div className="stat-value">{queue.length}</div>
                <div className="stat-label">Pending Requests in Queue</div>
                <p className="stat-description">
                  NGO requests awaiting fair First-In, First-Out allocation.
                </p>
              </div>

              <div className="stat-card">
                <div className="stat-value">{processedHistory.length}</div>
                <div className="stat-label">Completed Allocations</div>
                <p className="stat-description">
                  Total rescue allocations dequeued and recorded in the database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW KINDMEAL WORKS (3-Step FIFO Workflow) */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Transparent Process</span>
            <h2 className="section-title">How KindMeal Works</h2>
            <p className="section-subtitle">
              Fair surplus food redirection governed by a strict First-In, First-Out Queue.
            </p>
          </div>

          <div className="steps-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-number-tag">01</div>
              <div className="step-icon-wrap">
                <Building2 size={24} />
              </div>
              <h3 className="step-title">1. DISCOVER AVAILABLE FOOD</h3>
              <p className="step-desc">
                Canteens, restaurants, and bakeries list their available surplus portions with location and pickup deadlines.
              </p>
              <div className="step-arrow-subtle">
                <ArrowRight size={18} />
              </div>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-number-tag">02</div>
              <div className="step-icon-wrap text-accent">
                <Utensils size={24} />
              </div>
              <h3 className="step-title">2. SUBMIT A REQUEST</h3>
              <p className="step-desc">
                An NGO selects a specific food donor and submits requested portions. The request enters the queue at the REAR.
              </p>
              <div className="step-arrow-subtle">
                <ArrowRight size={18} />
              </div>
            </div>

            {/* Step 3 */}
            <div className="step-card highlight-front-step">
              <div className="step-number-tag">03</div>
              <div className="step-icon-wrap text-secondary">
                <HeartHandshake size={24} />
              </div>
              <h3 className="step-title">3. RECEIVE FIFO ALLOCATION</h3>
              <p className="step-desc">
                The oldest pending request at the FRONT is processed first. Stock is deducted only from that donor, ensuring total fairness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FIFO EXPLANATION */}
      <section className="fifo-section">
        <div className="container">
          <div className="fifo-clean-card">
            <div className="fifo-diagram-simple">
              <div className="fifo-block fifo-in">
                <span className="fifo-tag">ARRIVAL</span>
                <span className="fifo-text-bold">FIRST IN</span>
                <span className="fifo-sub">Requests enter at REAR</span>
              </div>

              <div className="fifo-flow-arrow">
                <div className="arrow-badge">FIFO QUEUE</div>
                <ArrowDown size={28} className="arrow-down-icon" />
              </div>

              <div className="fifo-block fifo-out">
                <span className="fifo-tag tag-green">DISPATCH</span>
                <span className="fifo-text-bold text-secondary">FIRST OUT</span>
                <span className="fifo-sub">Meals served from FRONT</span>
              </div>
            </div>

            <div className="fifo-explanation-text">
              <h3 className="fifo-heading">Why KindMeal Uses a Queue</h3>
              <p className="fifo-desc">
                KindMeal uses a First-In, First-Out (FIFO) queue data structure to ensure surplus meal requests are fulfilled with complete fairness, transparency, and without favoritism. Perishable meals are rescued in the exact sequence requests arrive.
              </p>
              <div className="fifo-benefit-pills">
                <span className="badge badge-neutral">No Priority Jumping</span>
                <span className="badge badge-neutral">Deterministic Arrival Order</span>
                <span className="badge badge-green">Donor Stock Isolated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINAL CTA */}
      <section className="final-cta-section">
        <div className="container">
          <div className="cta-banner-card">
            <div className="cta-banner-content">
              <span className="cta-badge">Join The Movement</span>
              <h2 className="cta-heading">Ready to rescue surplus food?</h2>
              <p className="cta-sub">
                Explore currently listed surplus food from nearby kitchens, or observe the live queue dispatch mechanism.
              </p>
              <div className="cta-buttons">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => {
                    setActivePage('available');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  id="cta-view-available-btn"
                >
                  <Utensils size={18} />
                  <span>View Available Food</span>
                </button>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => {
                    setActivePage('queue');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  id="cta-view-queue-btn"
                >
                  <Layers size={18} />
                  <span>View Rescue Queue</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
