import React from 'react';
import { useVendorState } from '../useVendorState';
import VendorModuleLocked from './VendorModuleLocked';

/**
 * VendorOperationalGuard (UX / Navigation Guard)
 * 
 * NOTE: This frontend guard does NOT replace backend authorization.
 * Backend middleware (requireVendorApproval, requireSubscription, protectVendor)
 * remains strictly authoritative on all API endpoints.
 * 
 * This component provides a transparent, informative UX by explaining
 * why an operational module is not yet unlocked and providing actionable CTAs.
 */
const VendorOperationalGuard = ({ moduleName, children }) => {
  const { vendorState, loading } = useVendorState();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7c3aed]"></div>
      </div>
    );
  }

  const isApproved = vendorState?.status === 'Approved';
  const isSubscribed = vendorState?.subscription?.status === 'Active';
  const isActive = vendorState?.isActive !== false && vendorState?.status !== 'Suspended';

  const canAccessOperations = isApproved && isSubscribed && isActive;

  if (!canAccessOperations) {
    return <VendorModuleLocked moduleName={moduleName} />;
  }

  return children;
};

export default VendorOperationalGuard;
