import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './vendorTheme.css';
import VendorLayout from './components/VendorLayout';
import VendorPublicLayout from './components/VendorPublicLayout';
import VendorRegister from './pages/VendorRegister';
import VendorLogin from './pages/VendorLogin';
import VendorSubscriptionOnboarding from './pages/VendorSubscriptionOnboarding';
import VendorReviewOnboarding from './pages/VendorReviewOnboarding';
import VendorSubmittedOnboarding from './pages/VendorSubmittedOnboarding';
import VendorDashboard from './pages/VendorDashboard';
import VendorServices from './pages/VendorServices';
import VendorPricing from './pages/VendorPricing';
import VendorPortfolio from './pages/VendorPortfolio';
import VendorLeads from './pages/VendorLeads';
import VendorQuotes from './pages/VendorQuotes';
import VendorBookings from './pages/VendorBookings';
import VendorCalendar from './pages/VendorCalendar';
import VendorChat from './pages/VendorChat';
import VendorEarnings from './pages/VendorEarnings';
import VendorReviews from './pages/VendorReviews';
import VendorProfile from './pages/VendorProfile';
import VendorSupport from './pages/VendorSupport';
import VendorSettings from './pages/VendorSettings';
import VendorInventory from './pages/VendorInventory';
import VendorNotifications from './pages/VendorNotifications';
import VendorOperationalGuard from './components/VendorOperationalGuard';
import { VendorProvider } from './useVendorState';

const VendorRoutes = () => {
  return (
    <VendorProvider>
      <Routes>
        <Route element={<VendorPublicLayout />}>
          <Route path="register" element={<Navigate to="/vendor/register/category" replace />} />
          <Route path="register/:stepId" element={<VendorRegister />} />
          <Route path="login" element={<VendorLogin />} />
          <Route path="onboarding" element={<Navigate to="/vendor/onboarding/subscription" replace />} />
          <Route path="onboarding/subscription" element={<VendorSubscriptionOnboarding />} />
          <Route path="onboarding/review" element={<VendorReviewOnboarding />} />
          <Route path="onboarding/submitted" element={<VendorSubmittedOnboarding />} />
        </Route>
        <Route element={<VendorLayout />}>
          {/* Storefront & Setup Modules (accessible during review/setup) */}
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="profile" element={<VendorProfile />} />
          <Route path="services" element={<VendorServices />} />
          <Route path="pricing" element={<VendorPricing />} />
          <Route path="portfolio" element={<VendorPortfolio />} />
          <Route path="inventory" element={<VendorInventory />} />
          <Route path="settings" element={<VendorSettings />} />
          <Route path="support" element={<VendorSupport />} />
          <Route path="notifications" element={<VendorNotifications />} />

          {/* Operational Modules (require approval & active subscription) */}
          <Route 
            path="leads" 
            element={
              <VendorOperationalGuard moduleName="Inquiries & Leads">
                <VendorLeads />
              </VendorOperationalGuard>
            } 
          />
          <Route 
            path="quotes" 
            element={
              <VendorOperationalGuard moduleName="Quotes">
                <VendorQuotes />
              </VendorOperationalGuard>
            } 
          />
          <Route 
            path="bookings" 
            element={
              <VendorOperationalGuard moduleName="Bookings">
                <VendorBookings />
              </VendorOperationalGuard>
            } 
          />
          <Route 
            path="calendar" 
            element={
              <VendorOperationalGuard moduleName="Calendar">
                <VendorCalendar />
              </VendorOperationalGuard>
            } 
          />
          <Route 
            path="chat" 
            element={
              <VendorOperationalGuard moduleName="Chat & Messaging">
                <VendorChat />
              </VendorOperationalGuard>
            } 
          />
          <Route 
            path="earnings" 
            element={
              <VendorOperationalGuard moduleName="Earnings & Payouts">
                <VendorEarnings />
              </VendorOperationalGuard>
            } 
          />
          <Route 
            path="reviews" 
            element={
              <VendorOperationalGuard moduleName="Reviews">
                <VendorReviews />
              </VendorOperationalGuard>
            } 
          />
        </Route>
        <Route path="" element={<Navigate to="/vendor/login" replace />} />
        <Route path="*" element={<Navigate to="/vendor/login" replace />} />
      </Routes>
    </VendorProvider>
  );
};

export default VendorRoutes;
