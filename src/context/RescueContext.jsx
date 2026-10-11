import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../services/api';
import {
  INITIAL_AVAILABLE_MEALS,
  INITIAL_FOOD_LISTINGS,
  INITIAL_QUEUE,
  INITIAL_PROCESSED,
  getDonorInitials
} from '../data/initialData';

const RescueContext = createContext(null);

function mapDonorFromApi(d) {
  return {
    id: d.donor_id,
    category: d.food_category,
    donor: d.donor_name,
    quantity: d.available_quantity,
    unit: d.unit,
    location: d.location,
    deadline: d.pickup_deadline,
    description: d.food_description,
    status: d.available_quantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
    typeBadge: d.type_badge,
    prepTime: d.prep_time,
    dietary: d.dietary
  };
}

function mapRequestFromApi(req, index) {
  return {
    id: req.request_id,
    queueSequence: req.queue_sequence,
    ngoName: req.ngo_name,
    mealsRequested: req.requested_quantity,
    requestedAt: req.request_timestamp,
    contactPerson: req.contact_person,
    targetBeneficiary: req.target_beneficiary,
    foodListingId: req.donor_id,
    donorName: req.donor_name,
    donorInitials: getDonorInitials(req.donor_name),
    foodCategory: req.food_category,
    unit: req.unit || 'meals',
    status: index === 0 ? 'NEXT' : 'WAITING'
  };
}

function mapAllocationFromApi(a) {
  return {
    id: a.allocation_id,
    requestId: a.request_id,
    ngoName: a.ngo_name,
    mealsAllocated: a.allocated_quantity,
    donorName: a.donor_name,
    donorInitials: getDonorInitials(a.donor_name),
    foodCategory: a.food_category,
    unit: a.unit || 'meals',
    processedAt: `✓ ${a.allocation_timestamp}`,
    processedTimestamp: a.allocation_timestamp,
    targetBeneficiary: 'NGO / Community Partner'
  };
}

export function RescueProvider({ children }) {
  const [activePage, setActivePage] = useState('home'); // 'home' | 'available' | 'queue'
  const [availableMeals, setAvailableMeals] = useState(INITIAL_AVAILABLE_MEALS);
  const [availablePacks, setAvailablePacks] = useState(105);
  const [queue, setQueue] = useState([]);
  const [processedHistory, setProcessedHistory] = useState([]);
  const [foodListings, setFoodListings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedNgo, setLastProcessedNgo] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    listing: null
  });

  // Toast Notification State
  const [toast, setToast] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success' // 'success' | 'process' | 'warning' | 'info'
  });

  // Toast auto-dismiss timer
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const showToast = useCallback((title, message, type = 'success') => {
    setToast({
      visible: true,
      title,
      message,
      type
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // Fetch all state from Flask backend
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [donorsRes, queueRes, allocRes, statsRes] = await Promise.all([
        api.getDonors(),
        api.getQueue(),
        api.getAllocations(),
        api.getDashboardStats()
      ]);

      if (donorsRes?.donors) {
        setFoodListings(donorsRes.donors.map(mapDonorFromApi));
      }

      if (queueRes?.queue) {
        setQueue(queueRes.queue.map(mapRequestFromApi));
      }

      if (allocRes?.allocations) {
        setProcessedHistory(allocRes.allocations.map(mapAllocationFromApi));
      }

      if (statsRes?.stats) {
        setAvailableMeals(statsRes.stats.available_meals ?? 0);
        setAvailablePacks(statsRes.stats.available_packs ?? 0);
      }

      setBackendConnected(true);
    } catch (err) {
      console.warn('Backend connection warning:', err.message);
      setBackendConnected(false);
      // Fallback display to initial data if backend not yet running
      setFoodListings(INITIAL_FOOD_LISTINGS);
      setQueue(INITIAL_QUEUE);
      setProcessedHistory(INITIAL_PROCESSED);
      setAvailableMeals(INITIAL_AVAILABLE_MEALS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const openRequestModal = useCallback((listing) => {
    setModalState({
      isOpen: true,
      listing: listing || (foodListings.length > 0 ? foodListings[0] : null)
    });
  }, [foodListings]);

  const closeRequestModal = useCallback(() => {
    setModalState({
      isOpen: false,
      listing: null
    });
  }, []);

  const getCurrentFormattedTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${formattedMinutes} ${ampm}`;
  };

  // Enqueue a new NGO request via Flask API
  const enqueueRequest = async ({ ngoName, mealsRequested, listing }) => {
    const donorId = listing ? listing.id : 'listing-1';
    const timestamp = getCurrentFormattedTime();

    try {
      const response = await api.submitRequest({
        ngoName: ngoName.trim(),
        donorId,
        requestedQuantity: Number(mealsRequested),
        requestTimestamp: timestamp,
        contactPerson: 'Volunteer Lead',
        targetBeneficiary: 'NGO / Community Partner'
      });

      closeRequestModal();
      await loadData();

      showToast(
        'Request added to the rescue queue.',
        `Queue position #${response.position}. Requested from ${listing?.donor || 'Donor'} (FIFO).`,
        'success'
      );
      return { success: true, position: response.position };
    } catch (error) {
      showToast(
        'Request Submission Failed',
        error.message || 'Could not submit request to the queue.',
        'warning'
      );
      return { success: false, error: error.message };
    }
  };

  // Dequeue the FRONT request via Flask API
  const dequeueRequest = async () => {
    if (queue.length === 0) {
      showToast('Queue is empty', 'There are no pending requests to process.', 'info');
      return { success: false, reason: 'empty_queue' };
    }

    const frontRequest = queue[0];
    setIsProcessing(true);
    setLastProcessedNgo(frontRequest.ngoName);

    try {
      const result = await api.processFrontRequest();

      // Refresh state from backend
      await loadData();
      setIsProcessing(false);

      showToast(
        `${frontRequest.ngoName}'s request fulfilled.`,
        `${frontRequest.mealsRequested} ${frontRequest.unit || 'meals'} allocated from ${frontRequest.donorName} (FIFO).`,
        'process'
      );

      return { success: true, result };
    } catch (error) {
      setIsProcessing(false);
      // Insufficient stock or backend validation failure
      showToast(
        'Allocation Failed',
        error.message || 'Could not fulfill front request.',
        'warning'
      );
      return { success: false, error: error.message };
    }
  };

  // Reset Demo to pristine starting state via Flask API
  const resetDemo = async () => {
    try {
      await api.resetDemo();
      await loadData();
      setLastProcessedNgo(null);
      showToast(
        'Demo State Reset',
        'Database tables and FIFO queue restored to initial demo state.',
        'info'
      );
    } catch (error) {
      // Offline fallback
      setAvailableMeals(INITIAL_AVAILABLE_MEALS);
      setFoodListings(INITIAL_FOOD_LISTINGS);
      setQueue(INITIAL_QUEUE);
      setProcessedHistory(INITIAL_PROCESSED);
      setLastProcessedNgo(null);
      showToast(
        'Local Demo Reset',
        'Initial state restored locally.',
        'info'
      );
    }
  };

  return (
    <RescueContext.Provider
      value={{
        activePage,
        setActivePage,
        availableMeals,
        availablePacks,
        queue,
        processedHistory,
        foodListings,
        isProcessing,
        lastProcessedNgo,
        backendConnected,
        isLoading,
        loadData,
        modalState,
        openRequestModal,
        closeRequestModal,
        enqueueRequest,
        dequeueRequest,
        resetDemo,
        toast,
        showToast,
        dismissToast
      }}
    >
      {children}
    </RescueContext.Provider>
  );
}

export function useRescue() {
  const context = useContext(RescueContext);
  if (!context) {
    throw new Error('useRescue must be used within a RescueProvider');
  }
  return context;
}
