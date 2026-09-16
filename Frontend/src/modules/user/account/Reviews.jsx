import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { userApi } from '../../../services/userApi';

const Reviews = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [reviews, setReviews] = useState([]);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const loadReviewData = async () => {
    try {
      setLoading(true);
      setError('');
      const [reviewsRes, eligibleRes] = await Promise.all([
        userApi.getUserReviews(),
        userApi.getEligibleReviewBookings()
      ]);

      if (reviewsRes.success) {
        setReviews(reviewsRes.data?.reviews || []);
      }
      if (eligibleRes.success) {
        const bookingsList = eligibleRes.data?.eligibleBookings || [];
        setEligibleBookings(bookingsList);

        // If navigated with a target bookingId in state, open modal automatically
        if (location.state?.bookingId) {
          const target = bookingsList.find(b => b._id === location.state.bookingId);
          if (target) {
            openReviewModal(target);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load reviews from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewData();
  }, []);

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setRating(5);
    setComment('');
    setPhotos([]);
    setModalError('');
    setModalSuccess('');
    setIsModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
    setModalError('');
    setModalSuccess('');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModalError('Please upload a valid image');
      return;
    }

    try {
      setUploadingPhoto(true);
      setModalError('');
      const res = await userApi.uploadImage(file);
      const url = res.data?.url || res.url;
      if (url) {
        setPhotos(prev => [...prev, url]);
      }
    } catch (err) {
      setModalError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    if (!comment.trim()) {
      setModalError('Please enter a review comment');
      return;
    }

    try {
      setSubmitting(true);
      setModalError('');
      const vendorId = selectedBooking.vendorId?._id || selectedBooking.vendorId;

      const res = await userApi.createReview({
        bookingId: selectedBooking._id,
        vendorId,
        rating: Number(rating),
        comment: comment.trim(),
        photos
      });

      if (res.success) {
        setModalSuccess('Review submitted successfully! Thank you for your feedback.');
        setTimeout(() => {
          closeReviewModal();
          loadReviewData();
        }, 1200);
      } else {
        throw new Error(res.message || 'Failed to submit review');
      }
    } catch (err) {
      setModalError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (starCount) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Icon
        key={index}
        name="star"
        size="xs"
        style={{
          color: index < starCount ? '#fbbf24' : theme.semantic.border.light
        }}
      />
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 px-4 py-4 border-b backdrop-blur-sm"
        style={{ 
          backgroundColor: `${theme.semantic.background.primary}95`,
          borderBottomColor: theme.semantic.border.light 
        }}
      >
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 p-2 rounded-full"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: theme.semantic.text.primary }}>
              My Reviews
            </h1>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Share verified feedback for your booked vendors
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading reviews from MongoDB...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Section 1: Eligible Bookings for Review */}
            {eligibleBookings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Eligible for Review ({eligibleBookings.length})
                  </h2>
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                    Verified Bookings
                  </span>
                </div>

                <div className="space-y-3">
                  {eligibleBookings.map((b) => {
                    const vendorName = b.vendorId?.businessName || 'Wedding Vendor';
                    const category = b.vendorId?.category || b.services?.[0] || 'Vendor';
                    const vendorImage = b.vendorId?.profileImage || b.vendorId?.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=120&h=120&fit=crop';

                    return (
                      <Card key={b._id} className="p-4 border border-slate-100 shadow-sm rounded-2xl">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 min-w-0">
                            <img
                              src={vendorImage}
                              alt={vendorName}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-slate-900 truncate">
                                {vendorName}
                              </h3>
                              <p className="text-xs text-slate-500 truncate capitalize">
                                {category} • Event: {formatDate(b.eventDate)}
                              </p>
                              <p className="text-[10px] font-semibold text-emerald-600">
                                Booking #{b._id.slice(-6).toUpperCase()} • Confirmed
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openReviewModal(b)}
                            style={{
                              backgroundColor: theme.colors.primary[500],
                              color: 'white'
                            }}
                            className="shrink-0 shadow-md shadow-rose-200"
                          >
                            Write Review
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Submitted Reviews */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                Submitted Reviews ({reviews.length})
              </h2>

              {reviews.length === 0 ? (
                <Card className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white shadow-sm"
                  >
                    <Icon name="star" size="xl" style={{ color: theme.semantic.text.secondary }} />
                  </div>
                  <h3 className="font-bold text-sm mb-1 text-slate-800">
                    No Reviews Submitted Yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Once you have a confirmed booking with a vendor, you will be able to review their service and help other couples make informed decisions.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => {
                    const vendorName = r.vendorId?.businessName || 'Vendor';
                    const category = r.vendorId?.category || 'Wedding Service';

                    return (
                      <Card key={r._id} className="p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="space-y-3">
                          {/* Vendor & Rating Row */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-sm text-slate-900">
                                {vendorName}
                              </h3>
                              <p className="text-xs text-slate-500 capitalize">
                                {category}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="flex items-center space-x-1 mb-1">
                                {renderStars(r.rating)}
                              </div>
                              <p className="text-[10px] text-slate-400 font-semibold">
                                {formatDate(r.createdAt)}
                              </p>
                            </div>
                          </div>

                          {/* Review Content */}
                          <p className="text-xs leading-relaxed text-slate-700">
                            {r.comment}
                          </p>

                          {/* Photos if any */}
                          {r.photos?.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {r.photos.map((photoUrl, pIdx) => (
                                <img
                                  key={pIdx}
                                  src={photoUrl}
                                  alt={`Review Photo ${pIdx + 1}`}
                                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm"
                                />
                              ))}
                            </div>
                          )}

                          {/* Booking verification tag */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                              <Icon name="checkCircle" size="xs" /> Verified Customer Review
                            </span>
                            <span>
                              Status: <span className="font-semibold text-slate-600">{r.status || 'Approved'}</span>
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* WRITE REVIEW MODAL */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Review {selectedBooking.vendorId?.businessName || 'Vendor'}
                </h3>
                <p className="text-xs text-slate-500">
                  Booking #{selectedBooking._id.slice(-6).toUpperCase()}
                </p>
              </div>
              <button
                onClick={closeReviewModal}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Rating (1 to 5 Stars) *
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={star <= rating ? '#fbbf24' : '#e2e8f0'}
                        className="w-8 h-8"
                      >
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 pl-2">
                    {rating} / 5
                  </span>
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Review *
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience working with this vendor. How was the quality, timeliness, and communication?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              {/* Photos Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Add Photos (Optional)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                      <img src={p} alt="Uploaded" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors">
                  <Icon name="camera" size="xs" />
                  {uploadingPhoto ? 'Uploading to cloud...' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  onClick={closeReviewModal}
                  className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || uploadingPhoto}
                  className="flex-1 bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-200"
                >
                  {submitting ? 'Submitting to MongoDB...' : 'Submit Review'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;