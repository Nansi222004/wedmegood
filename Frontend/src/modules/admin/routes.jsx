import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import PageLoader from '../../components/common/PageLoader';
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminVendors = lazy(() => import('./pages/AdminVendors'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminSubscriptions = lazy(() => import('./pages/AdminSubscriptions'));
const AdminPayments = lazy(() => import('./pages/AdminPayments'));
const AdminEditorial = lazy(() => import('./pages/AdminEditorial'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminLogs = lazy(() => import('./pages/AdminLogs'));
const AdminBookings = lazy(() => import('./pages/AdminBookings'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminBanners = lazy(() => import('./pages/AdminBanners'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminForgotPassword = lazy(() => import('./pages/AdminForgotPassword'));
const AdminResetPassword = lazy(() => import('./pages/AdminResetPassword'));
const AdminGateways = lazy(() => import('./pages/AdminGateways'));
const AdminVendorVerification = lazy(() => import('./pages/AdminVendorVerification'));
const AdminVendorServices = lazy(() => import('./pages/AdminVendorServices'));
const AdminCategories = lazy(() => import('./pages/AdminCategories'));
const AdminSubCategories = lazy(() => import('./pages/AdminSubCategories'));
const AdminFormTemplates = lazy(() => import('./pages/AdminFormTemplates'));
const AdminReviews = lazy(() => import('./pages/AdminReviews'));
const AdminVendorLedger = lazy(() => import('./pages/AdminVendorLedger'));
const AdminPolicies = lazy(() => import('./pages/AdminPolicies'));
const AdminSupport = lazy(() => import('./pages/AdminSupport'));
const AdminVendorInventory = lazy(() => import('./pages/AdminVendorInventory'));
const AdminLeads = lazy(() => import('./pages/AdminLeads'));
const AdminQuotes = lazy(() => import('./pages/AdminQuotes'));
const AdminComplaints = lazy(() => import('./pages/AdminComplaints'));
const AdminFakeVendors = lazy(() => import('./pages/AdminFakeVendors'));

// Simple placeholder page component

const PlaceholderPage = ({ title }) => (
  <div className="space-y-4">
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="text-slate-500 mt-1">This module is currently under development.</p>
    </div>
  </div>
);

const AdminRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="forgot-password" element={<AdminForgotPassword />} />
      <Route path="reset-password" element={<AdminResetPassword />} />
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="vendors" element={<AdminVendors />} />
        <Route path="vendor-services" element={<AdminVendorServices />} />
        <Route path="vendor-inventory" element={<AdminVendorInventory />} />
        <Route path="verification" element={<AdminVendorVerification />} />
        <Route path="vendor-ledger" element={<AdminVendorLedger />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="quotes" element={<AdminQuotes />} />
        <Route path="complaints" element={<AdminComplaints />} />
        <Route path="fake-vendors" element={<AdminFakeVendors />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="checkout" element={<AdminGateways />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="subcategories" element={<AdminSubCategories />} />
        <Route path="form-templates" element={<AdminFormTemplates />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="policies" element={<AdminPolicies />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="profile" element={<AdminProfile />} />

        <Route path="security" element={<PlaceholderPage title="Privacy & Security Access" />} />
      </Route>
      {/* Fallback */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
    </Suspense>
  );
};

export default AdminRoutes;