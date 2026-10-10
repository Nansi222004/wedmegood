import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './vendorTheme.css';
import VendorLayout from './components/VendorLayout';
import PageLoader from '../../components/common/PageLoader';
import VendorPublicLayout from './components/VendorPublicLayout';
const VendorRegister = lazy(() => import('./pages/VendorRegister'));
const VendorLogin = lazy(() => import('./pages/VendorLogin'));
const VendorSubscriptionOnboarding = lazy(() => import('./pages/VendorSubscriptionOnboarding'));
const VendorReviewOnboarding = lazy(() => import('./pages/VendorReviewOnboarding'));
const VendorSubmittedOnboarding = lazy(() => import('./pages/VendorSubmittedOnboarding'));
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const VendorServices = lazy(() => import('./pages/VendorServices'));
const VendorPricing = lazy(() => import('./pages/VendorPricing'));
const VendorPortfolio = lazy(() => import('./pages/VendorPortfolio'));
const VendorLeads = lazy(() => import('./pages/VendorLeads'));
const VendorQuotes = lazy(() => import('./pages/VendorQuotes'));
const VendorBookings = lazy(() => import('./pages/VendorBookings'));
const VendorCalendar = lazy(() => import('./pages/VendorCalendar'));
const VendorChat = lazy(() => import('./pages/VendorChat'));
const VendorEarnings = lazy(() => import('./pages/VendorEarnings'));
const VendorReviews = lazy(() => import('./pages/VendorReviews'));
const VendorProfile = lazy(() => import('./pages/VendorProfile'));
const VendorSupport = lazy(() => import('./pages/VendorSupport'));
const VendorSettings = lazy(() => import('./pages/VendorSettings'));
const VendorInventory = lazy(() => import('./pages/VendorInventory'));
const VendorNotifications = lazy(() => import('./pages/VendorNotifications'));
import VendorOperationalGuard from './components/VendorOperationalGuard';
import { VendorProvider } from './useVendorState';

const VendorRoutes = () => {
  return (
    <VendorProvider>
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </VendorProvider>
  );
};

export default VendorRoutes;
