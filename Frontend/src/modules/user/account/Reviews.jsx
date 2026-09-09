import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const Reviews = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [reviews] = useState([
    {
      id: 1,
      vendorName: 'Royal Photography Studio',
      vendorType: 'Wedding Photographer',
      rating: 5,
      review: 'Absolutely amazing work! They captured every moment perfectly. The team was professional and the photos exceeded our expectations.',
      date: '2024-01-15',
      images: [
        'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=100&h=100&fit=crop',
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=100&h=100&fit=crop'
      ],
      helpful: 12,
      vendorResponse: 'Thank you so much for the wonderful review! It was our pleasure to capture your special day.'
    },
    {
      id: 2,
      vendorName: 'Elegant Decorators',
      vendorType: 'Wedding Decorator',
      rating: 4,
      review: 'Great decoration work. The floral arrangements were beautiful and the setup was done on time.',
      date: '2024-01-10',
      images: [],
      helpful: 8,
      vendorResponse: null
    }
  ]);

  const [pendingReviews] = useState([
    {
      id: 1,
      vendorName: 'Spice Garden Catering',
      vendorType: 'Wedding Caterer',
      bookingDate: '2024-01-20',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&h=100&fit=crop'
    }
  ]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Icon
        key={index}
        name="star"
        size="xs"
        style={{
          color: index < rating ? '#fbbf24' : theme.semantic.border.light
        }}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleWriteReview = (vendor) => {
    // Navigate to review writing page
    navigate(`/user/vendor/${vendor.id}/review`);
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
              Reviews you've given to vendors
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-3" style={{ color: theme.semantic.text.primary }}>
              Pending Reviews
            </h2>
            <div className="space-y-3">
              {pendingReviews.map((vendor) => (
                <Card key={vendor.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={vendor.image}
                        alt={vendor.vendorName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-medium" style={{ color: theme.semantic.text.primary }}>
                          {vendor.vendorName}
                        </h3>
                        <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                          {vendor.vendorType}
                        </p>
                        <p className="text-xs" style={{ color: theme.semantic.text.tertiary }}>
                          Booked on {formatDate(vendor.bookingDate)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleWriteReview(vendor)}
                      style={{
                        backgroundColor: theme.colors.primary[500],
                        color: 'white'
                      }}
                    >
                      Write Review
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* My Reviews */}
        <div>
          <h2 className="text-base font-semibold mb-3" style={{ color: theme.semantic.text.primary }}>
            My Reviews ({reviews.length})
          </h2>
          
          {reviews.length === 0 ? (
            <Card className="p-8 text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: theme.semantic.background.accent }}
              >
                <Icon name="star" size="xl" style={{ color: theme.semantic.text.secondary }} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: theme.semantic.text.primary }}>
                No Reviews Yet
              </h3>
              <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                Start reviewing vendors you've worked with to help other couples.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-4">
                  <div className="space-y-3">
                    {/* Vendor Info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium" style={{ color: theme.semantic.text.primary }}>
                          {review.vendorName}
                        </h3>
                        <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                          {review.vendorType}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-xs" style={{ color: theme.semantic.text.tertiary }}>
                          {formatDate(review.date)}
                        </p>
                      </div>
                    </div>

                    {/* Review Text */}
                    <p className="text-sm leading-relaxed" style={{ color: theme.semantic.text.primary }}>
                      {review.review}
                    </p>

                    {/* Review Images */}
                    {review.images.length > 0 && (
                      <div className="flex space-x-2">
                        {review.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Review ${index + 1}`}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}

                    {/* Helpful Count */}
                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderTopColor: theme.semantic.border.light }}>
                      <div className="flex items-center space-x-1">
                        <Icon name="heart" size="xs" style={{ color: theme.colors.accent[500] }} />
                        <span className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                          {review.helpful} people found this helpful
                        </span>
                      </div>
                      <button className="text-xs" style={{ color: theme.colors.primary[600] }}>
                        Edit Review
                      </button>
                    </div>

                    {/* Vendor Response */}
                    {review.vendorResponse && (
                      <div 
                        className="p-3 rounded-lg mt-3"
                        style={{ backgroundColor: theme.semantic.background.accent }}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon name="chat" size="xs" style={{ color: theme.colors.primary[600] }} />
                          <span className="text-xs font-medium" style={{ color: theme.colors.primary[600] }}>
                            Vendor Response
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: theme.semantic.text.primary }}>
                          {review.vendorResponse}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews;