import React from 'react';
import { RescueProvider, useRescue } from './context/RescueContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RequestModal from './components/RequestModal';
import Toast from './components/Toast';
import HomePage from './pages/HomePage';
import AvailableFoodPage from './pages/AvailableFoodPage';
import RescueQueuePage from './pages/RescueQueuePage';
import './App.css';

function MainContent() {
  const { activePage } = useRescue();

  const renderPage = () => {
    switch (activePage) {
      case 'available':
        return <AvailableFoodPage />;
      case 'queue':
        return <RescueQueuePage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content" id="main-content" tabIndex="-1">
        {renderPage()}
      </main>
      <Footer />
      <RequestModal />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <RescueProvider>
      <MainContent />
    </RescueProvider>
  );
}
