import { useParams, Navigate } from 'react-router-dom';
import { vendors } from '../../../data/vendors';
import VendorDetail from '../vendors/VendorDetail';

const MakeupDetail = () => {
  const { vendorId } = useParams();
  
  // Get all makeup artists
  const makeupArtists = vendors.filter(v => v.category === 'makeup');
  
  // Check if vendorId is a number
  const id = parseInt(vendorId);
  
  // If it's a direct vendor ID (21-30), redirect to vendor detail
  if (id >= 21 && id <= 30) {
    return <Navigate to={`/user/vendor/${id}`} replace />;
  }
  
  // If it's an index (1-10), map to actual vendor ID
  if (id >= 1 && id <= makeupArtists.length) {
    const actualVendorId = makeupArtists[id - 1]?.id;
    if (actualVendorId) {
      return <Navigate to={`/user/vendor/${actualVendorId}`} replace />;
    }
  }
  
  // If vendor ID doesn't match any makeup artist, show vendor detail anyway
  // (it will handle the "not found" case)
  return <VendorDetail />;
};

export default MakeupDetail;
