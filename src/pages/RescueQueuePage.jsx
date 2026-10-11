import React, { useState } from 'react';
import { useRescue } from '../context/RescueContext';
import { getDonorInitials } from '../data/initialData';
import {
  Layers,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Clock,
  RotateCcw,
  Play,
  AlertTriangle,
  WifiOff
} from 'lucide-react';

export default function RescueQueuePage() {
  const {
    availableMeals,
    availablePacks,
    foodListings,
    queue,
    processedHistory,
    dequeueRequest,
    resetDemo,
    isProcessing,
    backendConnected
  } = useRescue();

  const [animatingId, setAnimatingId] = useState(null);

  // Front of Queue item (Position #1)
  const frontRequest = queue.length > 0 ? queue[0] : null;

  // Associated food listing for the front request
  const frontTargetListing = frontRequest
    ? foodListings.find((item) => item.id === frontRequest.foodListingId) ||
      foodListings.find((item) => item.donor === frontRequest.donorName) ||
      null
    : null;

  // Check if current front request can be fulfilled from its specific donor
  const hasInsufficientFood =
    frontRequest &&
    frontTargetListing &&
    frontRequest.mealsRequested > frontTargetListing.quantity;

  const handleProcessClick = async () => {
    if (!frontRequest || hasInsufficientFood || isProcessing) return;

    setAnimatingId(frontRequest.id);
    setTimeout(async () => {
      await dequeueRequest();
      setAnimatingId(null);
    }, 280);
  };

  return (
    <div className="rescue-queue-page animate-fade-in">
      {/* 1. PAGE HEADER */}
      <section className="queue-header-section">
        <div className="container">
          {!backendConnected && (
            <div className="offline-notice mb-3" style={{ padding: '8px 16px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '8px', color: '#92400E', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <WifiOff size={16} />
              <span>Backend server is offline. Run Flask at <code>http://127.0.0.1:5000</code> for live database persistence.</span>
            </div>
          )}

          <div className="queue-header-flex">
            <div>
              <h1 className="page-title">Rescue Queue</h1>
              <p className="page-subtitle">
                Requests are processed in First-In, First-Out order.
              </p>
            </div>

            <div className="queue-header-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={resetDemo}
                title="Reset queue and available meals to demo start"
                id="reset-demo-btn"
              >
                <RotateCcw size={15} />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>

          {/* 2. SUMMARY ROW (4 Compact Horizontal Statistics) */}
          <div className="queue-summary-grid">
            {/* Stat 1: Total Surplus Available */}
            <div className="summary-metric-card">
              <span className="metric-tag">SURPLUS INVENTORY</span>
              <div className="metric-value-wrap">
                <span className="metric-big-num text-primary">{availableMeals}</span>
                <span className="metric-unit">meals + {availablePacks} packs</span>
              </div>
              <span className="metric-desc">Available Across Donors</span>
            </div>

            {/* Stat 2: Requests Waiting */}
            <div className="summary-metric-card">
              <span className="metric-tag">WAITING IN LINE</span>
              <div className="metric-value-wrap">
                <span className="metric-big-num text-secondary">{queue.length}</span>
                <span className="metric-unit">NGOs</span>
              </div>
              <span className="metric-desc">Pending in Queue</span>
            </div>

            {/* Stat 3: Front Position */}
            <div className="summary-metric-card">
              <span className="metric-tag">HEAD POINTER</span>
              <div className="metric-value-wrap">
                <span className="metric-big-num text-accent">
                  {queue.length > 0 ? '#1' : 'None'}
                </span>
                <span className="metric-unit">FRONT</span>
              </div>
              <span className="metric-desc">Front of Queue</span>
            </div>

            {/* Stat 4: Next NGO */}
            <div className="summary-metric-card highlight-card">
              <span className="metric-tag">NEXT RECIPIENT</span>
              <div className="metric-value-wrap">
                <span className="metric-ngo-name">
                  {frontRequest ? frontRequest.ngoName : 'Queue Empty'}
                </span>
              </div>
              <span className="metric-desc">
                {frontRequest
                  ? `${frontRequest.mealsRequested} ${frontRequest.unit || 'portions'} from ${frontRequest.donorName}`
                  : 'All requests served'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FIFO QUEUE SECTION (Prominent Full-Width Horizontal Visualization) */}
      <section className="queue-visual-section">
        <div className="container">
          <div className="queue-visual-card card">
            <div className="queue-visual-header">
              <div>
                <h3 className="queue-visual-title">FIFO Queue Visualization</h3>
                <p className="queue-visual-subtitle">
                  Requests enter at the <strong>REAR</strong> and are processed strictly from the <strong>FRONT</strong>. Order is deterministic and fair.
                </p>
              </div>

              <div className="queue-legend">
                <span className="legend-item">
                  <span className="legend-dot dot-front"></span> FRONT (Oldest / Next to Process)
                </span>
                <span className="legend-item">
                  <span className="legend-dot dot-rear"></span> REAR (Newest Arrival)
                </span>
              </div>
            </div>

            {/* Horizontal Queue Pipeline */}
            {queue.length === 0 ? (
              <div className="empty-queue-state">
                <div className="empty-icon-circle">
                  <CheckCircle2 size={36} className="text-secondary" />
                </div>
                <h4>The Rescue Queue is Empty!</h4>
                <p>All pending community meal requests have been successfully fulfilled.</p>
                <button
                  className="btn btn-secondary btn-sm mt-3"
                  onClick={resetDemo}
                >
                  <RotateCcw size={15} />
                  <span>Reload Demo Requests</span>
                </button>
              </div>
            ) : (
              <div className="horizontal-queue-container">
                {/* FRONT Marker */}
                <div className="queue-flow-marker front-flow-marker">
                  <span className="marker-pill front-pill">FRONT</span>
                  <span className="marker-sub-text">Next Out</span>
                </div>

                <div className="queue-flow-arrow desktop-arrow">
                  <ArrowRight size={20} />
                </div>

                {/* Horizontal Nodes List */}
                <div className="horizontal-nodes-track">
                  {queue.map((item, index) => {
                    const isFront = index === 0;
                    const isRear = index === queue.length - 1;
                    const isAnimating = animatingId === item.id;
                    const donorInitials =
                      item.donorInitials || getDonorInitials(item.donorName);

                    return (
                      <React.Fragment key={item.id}>
                        <div
                          className={`queue-flow-node ${isFront ? 'is-front-highlight' : ''} ${
                            isAnimating ? 'is-dequeuing' : ''
                          }`}
                          id={`queue-node-${index + 1}`}
                        >
                          {/* Node Header: #1 FRONT */}
                          <div className="node-head">
                            <div className="node-pos-wrap">
                              <span className="node-pos">#{index + 1}</span>
                              {isFront && (
                                <span className="pos-front-badge">FRONT</span>
                              )}
                            </div>
                            <span
                              className={`badge ${
                                isFront ? 'badge-green' : 'badge-neutral'
                              }`}
                            >
                              {isFront ? 'NEXT TO PROCESS' : 'WAITING'}
                            </span>
                          </div>

                          {/* Circular Donor Avatar / Initials */}
                          <div className="node-donor-avatar-wrap">
                            <div
                              className="donor-avatar"
                              title={`Food Source: ${item.donorName}`}
                            >
                              <span>{donorInitials}</span>
                            </div>
                          </div>

                          {/* Node Content */}
                          <div className="node-content">
                            <h4 className="node-title" title={item.ngoName}>
                              {item.ngoName}
                            </h4>
                            <span className="node-partner-label">
                              {item.targetBeneficiary || 'NGO / Community Partner'}
                            </span>

                            <div className="node-meals">
                              <strong>{item.mealsRequested}</strong> {item.unit || 'meals'}
                            </div>

                            {/* Food Source Identity */}
                            <div className="node-source-row" title={`Requested from: ${item.donorName}`}>
                              <span className="source-label">From:</span>
                              <span className="source-name">{item.donorName}</span>
                            </div>
                          </div>

                          {/* Node Footer */}
                          <div className="node-bottom">
                            <span className="node-time">
                              <Clock size={12} /> {item.requestedAt}
                            </span>
                            {isRear && queue.length > 1 && (
                              <span className="badge-rear-tag">REAR</span>
                            )}
                          </div>
                        </div>

                        {/* Connector Arrow Between Nodes */}
                        {index < queue.length - 1 && (
                          <div className="node-between-arrow">
                            <ArrowRight size={18} className="desktop-arrow-icon" />
                            <ArrowDown size={18} className="mobile-arrow-icon" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="queue-flow-arrow desktop-arrow">
                  <ArrowRight size={20} />
                </div>

                {/* REAR Marker */}
                <div className="queue-flow-marker rear-flow-marker">
                  <span className="marker-pill rear-pill">REAR</span>
                  <span className="marker-sub-text">New Arrivals</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. NEXT REQUEST / ALLOCATION ACTION */}
      <section className="next-action-section">
        <div className="container">
          <div className="next-action-card card" id="next-to-process-card">
            <div className="next-action-grid">
              <div className="next-action-info">
                <span className="section-label">Next to Process</span>
                {frontRequest ? (
                  <>
                    <div className="next-donor-identity-row">
                      <div
                        className="donor-avatar donor-avatar-lg"
                        title={`Food Source: ${frontRequest.donorName}`}
                      >
                        <span>
                          {frontRequest.donorInitials ||
                            getDonorInitials(frontRequest.donorName)}
                        </span>
                      </div>
                      <div>
                        <h3 className="next-ngo-title">{frontRequest.ngoName}</h3>
                        <span className="next-partner-label">
                          NGO / Community Partner
                        </span>
                      </div>
                    </div>

                    <div className="next-source-box">
                      <span className="source-box-label">From:</span>
                      <strong className="source-box-name">
                        {frontRequest.donorName}
                      </strong>
                    </div>

                    <p className="next-ngo-meta">
                      Position #1 in Queue · Requested {frontRequest.requestedAt} · Head of FIFO Dispatch
                    </p>

                    {hasInsufficientFood && (
                      <div className="insufficient-alert">
                        <AlertTriangle size={18} className="text-warning flex-shrink-0" />
                        <span>
                          Insufficient surplus at {frontRequest.donorName} (
                          {frontTargetListing ? frontTargetListing.quantity : 0} {frontTargetListing?.unit || 'units'} available, requires {frontRequest.mealsRequested}). Preserving queue order.
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="next-ngo-empty">
                    No requests waiting in queue.
                  </p>
                )}
              </div>

              <div className="next-action-quantity">
                {frontRequest && (
                  <div className="quantity-stat-box">
                    <span className="qty-number">{frontRequest.mealsRequested}</span>
                    <span className="qty-label">{frontRequest.unit || 'meals'} requested</span>
                  </div>
                )}
              </div>

              <div className="next-action-button-col">
                <button
                  className="btn btn-primary btn-lg process-btn"
                  onClick={handleProcessClick}
                  disabled={!frontRequest || hasInsufficientFood || isProcessing}
                  id="process-next-request-btn"
                >
                  <Play size={18} />
                  <span>
                    {isProcessing ? 'Processing Dequeue...' : 'Allocate Front Request'}
                  </span>
                </button>
                <span className="process-sub-note">
                  Deducts portions strictly from {frontRequest ? frontRequest.donorName : 'selected donor'} and shifts queue.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WAITING REQUESTS TABLE */}
      <section className="waiting-table-section">
        <div className="container">
          <div className="table-card card">
            <div className="table-card-header">
              <div>
                <h3 className="table-title">Waiting Requests</h3>
                <p className="table-subtitle">
                  All pending community organizations ordered chronologically by arrival time.
                </p>
              </div>
              <span className="badge badge-neutral">
                {queue.length} in Line
              </span>
            </div>

            {queue.length === 0 ? (
              <div className="table-empty-state">
                <p>No waiting requests in the queue.</p>
              </div>
            ) : (
              <div className="table-responsive-container">
                <table className="queue-table">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>Position</th>
                      <th style={{ width: '28%' }}>NGO / Community Partner</th>
                      <th style={{ width: '16%' }}>Quantity</th>
                      <th style={{ width: '26%' }}>Food Source (Donor)</th>
                      <th style={{ width: '10%' }}>Time</th>
                      <th style={{ width: '10%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((req, idx) => {
                      const isFrontRow = idx === 0;
                      const initials =
                        req.donorInitials || getDonorInitials(req.donorName);
                      return (
                        <tr
                          key={req.id}
                          className={`table-row ${isFrontRow ? 'row-front-highlight' : ''}`}
                        >
                          <td>
                            <div className="table-pos-pill">
                              <span className="pos-number">#{idx + 1}</span>
                              {isFrontRow && (
                                <span className="pos-front-tag">FRONT</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="table-ngo-info">
                              <strong className="table-ngo-name">{req.ngoName}</strong>
                              <span className="table-ngo-sub">
                                {req.targetBeneficiary || 'NGO / Community Partner'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="table-meals-bold">
                              {req.mealsRequested} {req.unit || 'meals'}
                            </span>
                          </td>
                          <td>
                            <div className="table-source-cell">
                              <div
                                className="donor-avatar donor-avatar-sm"
                                title={`Source: ${req.donorName}`}
                              >
                                <span>{initials}</span>
                              </div>
                              <span className="table-donor-name">{req.donorName}</span>
                            </div>
                          </td>
                          <td>
                            <span className="table-time-text">{req.requestedAt}</span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                isFrontRow ? 'badge-green' : 'badge-neutral'
                              }`}
                            >
                              {isFrontRow ? 'NEXT TO PROCESS' : 'WAITING'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. RECENTLY RESCUED ALLOCATION HISTORY */}
      <section className="recently-rescued-section">
        <div className="container">
          <div className="rescued-card card">
            <div className="rescued-card-header">
              <div className="rescued-title-wrap">
                <CheckCircle2 size={20} className="text-secondary" />
                <div>
                  <h3 className="rescued-title">Recently Rescued</h3>
                  <p className="rescued-subtitle">
                    Completed allocations dequeued from the rescue queue and saved in SQLite.
                  </p>
                </div>
              </div>
              <span className="badge badge-green">
                {processedHistory.length} Rescues Completed
              </span>
            </div>

            {processedHistory.length === 0 ? (
              <div className="rescued-empty-box">
                <p className="rescued-empty-text">No requests processed yet.</p>
                <span className="rescued-empty-sub">
                  Click <em>"Allocate Front Request"</em> above to fulfill the first queue item.
                </span>
              </div>
            ) : (
              <div className="rescued-items-list">
                {processedHistory.map((item) => (
                  <div key={item.id} className="rescued-row animate-fade-in">
                    <div className="rescued-row-left">
                      <div className="rescued-check-icon">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <h4 className="rescued-name">{item.ngoName}</h4>
                        <span className="rescued-sub">
                          From: <strong>{item.donorName || 'MCC Community Canteen'}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="rescued-row-mid">
                      <span className="rescued-pill">
                        <strong>{item.mealsAllocated}</strong> {item.unit || 'meals'} allocated
                      </span>
                    </div>

                    <div className="rescued-row-right">
                      <span className="rescued-time">{item.processedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
