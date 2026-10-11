import React, { useState, useEffect } from 'react';
import { useRescue } from '../context/RescueContext';
import { X, Building2, UtensilsCrossed, Clock, MapPin, CheckSquare, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function RequestModal() {
  const { modalState, closeRequestModal, enqueueRequest } = useRescue();
  const { isOpen, listing } = modalState;

  const [ngoName, setNgoName] = useState('');
  const [mealsRequired, setMealsRequired] = useState('');
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setNgoName('');
      setMealsRequired('');
      setPickupConfirmed(false);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeRequestModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeRequestModal]);

  if (!isOpen || !listing) return null;

  // Maximum selectable meals is capped by current batch/available
  const maxAvailable = listing.quantity;
  const unitLabel = listing.unit || 'meals';
  const quantityTitle = unitLabel === 'packs' ? 'Packs' : 'Meals';

  const validate = () => {
    const newErrors = {};

    if (!ngoName.trim()) {
      newErrors.ngoName = 'Organization / NGO name is required.';
    } else if (ngoName.trim().length < 2) {
      newErrors.ngoName = 'Please enter a valid organization name.';
    }

    const qty = Number(mealsRequired);
    if (!mealsRequired || isNaN(qty)) {
      newErrors.mealsRequired = `Please enter the number of ${unitLabel} required.`;
    } else if (qty <= 0) {
      newErrors.mealsRequired = 'Quantity must be greater than 0.';
    } else if (qty > maxAvailable) {
      newErrors.mealsRequired = `Cannot exceed available quantity (${maxAvailable} ${unitLabel}).`;
    }

    if (!pickupConfirmed) {
      newErrors.pickupConfirmed = 'You must confirm volunteer pickup before submitting.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    const result = await enqueueRequest({
      ngoName,
      mealsRequested: Number(mealsRequired),
      listing
    });
    setIsSubmitting(false);

    if (result && !result.success && result.error) {
      setErrors({ form: result.error });
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={closeRequestModal}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <span className="badge badge-green mb-1">Queue Enrollment</span>
            <h3 id="modal-title" className="modal-title">Request Surplus Food</h3>
            <p className="modal-subtitle">
              Fair allocation via First-In, First-Out (FIFO) queue.
            </p>
          </div>
          <button
            onClick={closeRequestModal}
            className="modal-close-btn"
            aria-label="Close dialog"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected Food Overview Card */}
        <div className="modal-food-summary">
          <div className="summary-left">
            <span className="summary-category-badge">{listing.category}</span>
            <h4 className="summary-donor-name">{listing.donor}</h4>
            <div className="summary-meta-row">
              <span className="meta-item">
                <MapPin size={13} /> {listing.location}
              </span>
              <span className="meta-item">
                <Clock size={13} /> {listing.deadline}
              </span>
            </div>
          </div>
          <div className="summary-right">
            <span className="summary-qty-label">Available for Rescue</span>
            <span className="summary-qty-value">
              {listing.quantity} <small>{unitLabel}</small>
            </span>
          </div>
        </div>

        {/* Request Form */}
        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {errors.form && (
            <div className="error-banner mb-3" style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', fontSize: '13px' }}>
              <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
              {errors.form}
            </div>
          )}

          {/* NGO Name */}
          <div className="form-group">
            <label htmlFor="ngo-name" className="form-label">
              NGO / Community Organization Name <span className="required-star">*</span>
            </label>
            <div className="input-with-icon">
              <Building2 size={18} className="input-icon" />
              <input
                id="ngo-name"
                type="text"
                className={`form-input ${errors.ngoName ? 'input-error' : ''}`}
                placeholder="e.g. Hope Foundation, Seva Relief Trust"
                value={ngoName}
                onChange={(e) => {
                  setNgoName(e.target.value);
                  if (errors.ngoName) setErrors({ ...errors, ngoName: null });
                }}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            {errors.ngoName && (
              <p className="error-message">
                <AlertCircle size={14} /> {errors.ngoName}
              </p>
            )}
          </div>

          {/* Quantity Required */}
          <div className="form-group">
            <label htmlFor="meals-required" className="form-label">
              {quantityTitle} Required ({unitLabel}) <span className="required-star">*</span>
            </label>
            <div className="input-with-icon">
              <UtensilsCrossed size={18} className="input-icon" />
              <input
                id="meals-required"
                type="number"
                min="1"
                max={maxAvailable}
                className={`form-input ${errors.mealsRequired ? 'input-error' : ''}`}
                placeholder={`Enter quantity (max ${maxAvailable})`}
                value={mealsRequired}
                onChange={(e) => {
                  setMealsRequired(e.target.value);
                  if (errors.mealsRequired) setErrors({ ...errors, mealsRequired: null });
                }}
                disabled={isSubmitting}
              />
            </div>
            <div className="input-helper-row">
              <span className="helper-text">
                Surplus available: <strong>{maxAvailable} {unitLabel}</strong>
              </span>
              {/* Quick Select Buttons */}
              <div className="quick-qty-pills">
                {[15, 25, 40].filter((q) => q <= maxAvailable).map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="pill-qty-btn"
                    disabled={isSubmitting}
                    onClick={() => {
                      setMealsRequired(String(q));
                      if (errors.mealsRequired) setErrors({ ...errors, mealsRequired: null });
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            {errors.mealsRequired && (
              <p className="error-message">
                <AlertCircle size={14} /> {errors.mealsRequired}
              </p>
            )}
          </div>

          {/* Pickup Confirmation */}
          <div className="form-group">
            <label className={`checkbox-label ${errors.pickupConfirmed ? 'checkbox-error' : ''}`}>
              <input
                type="checkbox"
                checked={pickupConfirmed}
                disabled={isSubmitting}
                onChange={(e) => {
                  setPickupConfirmed(e.target.checked);
                  if (errors.pickupConfirmed) setErrors({ ...errors, pickupConfirmed: null });
                }}
              />
              <span className="checkbox-text">
                <strong>I confirm volunteer pickup</strong> before {listing.deadline}. We have suitable food transport containers.
              </span>
            </label>
            {errors.pickupConfirmed && (
              <p className="error-message">
                <AlertCircle size={14} /> {errors.pickupConfirmed}
              </p>
            )}
          </div>

          {/* FIFO Guarantee Notice */}
          <div className="fifo-guarantee-box">
            <ShieldCheck size={18} className="text-secondary flex-shrink-0" />
            <p className="fifo-guarantee-text">
              <strong>FIFO Queue Guarantee:</strong> Your request enters at the <strong>REAR</strong> of the queue. Requests are processed in strict arrival order.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeRequestModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              id="submit-rescue-request"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enqueuing Request...' : 'Join Rescue Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
