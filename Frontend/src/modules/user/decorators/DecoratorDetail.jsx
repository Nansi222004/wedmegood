import { useParams, Navigate } from 'react-router-dom';
import { vendors } from '../../../data/vendors';
import VendorDetail from '../vendors/VendorDetail';

const DecoratorDetail = () => {
  const { vendorId } = useParams();
  
  // Get all decorators
  const decorators = vendors.filter(v => v.category === 'planning-decor');
  
  // Check if vendorId is a number
  const id = parseInt(vendorId);
  
  // If it's a direct vendor ID (31-40), redirect to vendor detail
  if (id >= 31 && id <= 40) {
    return <Navigate to={`/user/vendor/${id}`} replace />;
  }
  
  // If it's an index (1-10), map to actual vendor ID
  if (id >= 1 && id <= decorators.length) {
    const actualVendorId = decorators[id - 1]?.id;
    if (actualVendorId) {
      return <Navigate to={`/user/vendor/${actualVendorId}`} replace />;
    }
  }
  
  // If vendor ID doesn't match any decorator, show vendor detail anyway
  // (it will handle the "not found" case)
  return <VendorDetail />;
};

export default DecoratorDetail;
