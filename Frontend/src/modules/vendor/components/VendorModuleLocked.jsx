import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import { useVendorState } from '../useVendorState';

const VendorModuleLocked = ({ moduleName = 'Operational Module' }) => {
  const navigate = useNavigate();
  const { vendorState, refreshData } = useVendorState();

  const status = vendorState?.status || 'Incomplete';
  const isActive = vendorState?.isActive !== false;
  const subscriptionStatus = vendorState?.subscription?.status || 'Pending';

  let config = {
    badge: 'Under Review',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
    icon: 'shield',
    iconColor: '#D97706',
    iconBg: 'bg-amber-50',
    title: 'Storefront Under Review',
    description: `Your profile is currently under review. Operational features will become available after your account is approved.`,
    primaryBtnText: 'View Review Status',
    primaryAction: () => navigate('/vendor/dashboard'),
    secondaryBtnText: 'Manage Storefront & Services',
    secondaryAction: () => navigate('/vendor/services')
  };

  if (!isActive || status === 'Suspended') {
    config = {
      badge: 'Account Suspended',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
      icon: 'warning',
      iconColor: '#E11D48',
      iconBg: 'bg-rose-50',
      title: 'Account Suspended',
      description: `Your vendor account has been deactivated. Operational access to ${moduleName} is temporarily paused. Please contact support to resolve this issue.`,
      primaryBtnText: 'Contact Support',
      primaryAction: () => navigate('/vendor/support'),
      secondaryBtnText: 'View Profile',
      secondaryAction: () => navigate('/vendor/profile')
    };
  } else if (status === 'Rejected') {
    config = {
      badge: 'Application Rejected',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
      icon: 'close',
      iconColor: '#E11D48',
      iconBg: 'bg-rose-50',
      title: 'Application Not Approved',
      description: `Your application was not approved. Operational features such as ${moduleName} are unavailable. Please contact partner support for guidance.`,
      primaryBtnText: 'Contact Support',
      primaryAction: () => navigate('/vendor/support'),
      secondaryBtnText: 'View Profile',
      secondaryAction: () => navigate('/vendor/profile')
    };
  } else if (status === 'Incomplete') {
    config = {
      badge: 'Profile Incomplete',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      dotColor: 'bg-blue-500',
      icon: 'plan',
      iconColor: '#2563EB',
      iconBg: 'bg-blue-50',
      title: 'Profile Setup Required',
      description: `To activate operational modules such as ${moduleName}, please complete your business information, verification documents, and service details.`,
      primaryBtnText: 'Complete Verification Setup',
      primaryAction: () => navigate('/vendor/dashboard'),
      secondaryBtnText: 'Edit Profile Information',
      secondaryAction: () => navigate('/vendor/profile')
    };
  } else if (status === 'Approved' && subscriptionStatus !== 'Active') {
    config = {
      badge: 'Subscription Required',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      dotColor: 'bg-purple-500',
      icon: 'money',
      iconColor: '#7C3AED',
      iconBg: 'bg-purple-50',
      title: 'Active Subscription Required',
      description: `Your vendor account is approved! To unlock operational marketplace features such as ${moduleName}, please activate a partner subscription.`,
      primaryBtnText: 'Choose Subscription Plan',
      primaryAction: () => navigate('/vendor/onboarding/subscription'),
      secondaryBtnText: 'Return to Dashboard',
      secondaryAction: () => navigate('/vendor/dashboard')
    };
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <div className="max-w-xl w-full bg-white rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden space-y-6">
        {/* Soft background accents */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-rose-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-bold tracking-wide shadow-2xs"
            style={{ backgroundColor: 'inherit' }}
          >
            <span className={`inline-flex h-2 w-2 rounded-full ${config.dotColor} animate-pulse`} />
            <span className={`px-2 py-0.5 rounded-full ${config.badgeColor}`}>{config.badge}</span>
          </div>

          {/* Icon */}
          <div className={`h-20 w-20 rounded-3xl ${config.iconBg} flex items-center justify-center mx-auto shadow-inner border border-white`}>
            <Icon name={config.icon} size="lg" color={config.iconColor} />
          </div>

          {/* Heading and copy */}
          <div className="space-y-3 max-w-md mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {config.title}
            </h2>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={config.primaryAction}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md hover:brightness-105 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
            >
              {config.primaryBtnText}
            </button>
            {config.secondaryBtnText && (
              <button
                type="button"
                onClick={config.secondaryAction}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all active:scale-95"
              >
                {config.secondaryBtnText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorModuleLocked;
