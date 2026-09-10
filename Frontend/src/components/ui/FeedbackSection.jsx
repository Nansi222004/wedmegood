import { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import Icon from './Icon';
import Card from './Card';

const FeedbackSection = () => {
  const { theme } = useTheme();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleStarClick = (starRating) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmitFeedback = () => {
    if (rating > 0) {
      // Here you would typically send the feedback to your backend
      console.log('Feedback submitted:', { rating, feedback });
      setIsSubmitted(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setRating(0);
        setFeedback('');
      }, 3000);
    }
  };

  const getRatingText = (currentRating) => {
    switch (currentRating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  if (isSubmitted) {
    return (
      <div className="px-4 py-6 feedback-section-container">
        <Card className="feedback-premium-card">
          <div 
            className="p-6 text-center feedback-success"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary[50]} 0%, ${theme.colors.accent[50]} 100%)`
            }}
          >
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: theme.colors.primary[500] }}
            >
              <Icon name="check" size="lg" style={{ color: 'white' }} />
            </div>
            
            <h3 
              className="text-lg font-bold mb-2"
              style={{ color: theme.semantic.text.primary }}
            >
              Thank You! 🎉
            </h3>
            
            <p 
              className="text-sm"
              style={{ color: theme.semantic.text.secondary }}
            >
              Your feedback helps us make your wedding planning journey even better!
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 feedback-section-container">
      <Card className="feedback-premium-card feedback-card">
        <div 
          className="p-6 relative overflow-hidden feedback-background-pattern"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary[50]} 0%, ${theme.colors.accent[50]} 100%)`
          }}
        >
          {/* Background Wedding Image */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&crop=center)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          
          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Header */}
            <div className="mb-6">
              <div 
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: theme.colors.primary[100] }}
              >
                <Icon name="heart" size="md" className="feedback-heart-pulse" style={{ color: theme.colors.primary[600] }} />
              </div>
              
              <h3 
                className="text-xl font-bold mb-2"
                style={{ color: theme.semantic.text.primary }}
              >
                How was your experience with Utsavo?
              </h3>
              
              <p 
                className="text-sm"
                style={{ color: theme.semantic.text.secondary }}
              >
                Your feedback helps us improve your wedding planning experience
              </p>
            </div>

            {/* Star Rating */}
            <div className="mb-6">
              <div className="flex justify-center items-center space-x-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    onMouseLeave={handleStarLeave}
                    className="star-rating-button feedback-star-button transition-all duration-200 hover:scale-110 touch-friendly"
                    style={{ minHeight: '44px', minWidth: '44px' }}
                  >
                    <Icon 
                      name="star" 
                      size="lg" 
                      style={{ 
                        color: (hoveredRating || rating) >= star 
                          ? '#fbbf24' 
                          : theme.semantic.text.tertiary 
                      }} 
                    />
                  </button>
                ))}
              </div>
              
              {(rating > 0 || hoveredRating > 0) && (
                <p 
                  className="text-sm font-medium"
                  style={{ color: theme.colors.primary[600] }}
                >
                  {getRatingText(hoveredRating || rating)}
                </p>
              )}
            </div>

            {/* Optional Feedback Text */}
            {rating > 0 && (
              <div className="mb-6">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us more about your experience (optional)"
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg resize-none text-sm feedback-textarea"
                  style={{
                    borderColor: theme.semantic.border.default,
                    backgroundColor: theme.semantic.background.primary,
                    color: theme.semantic.text.primary
                  }}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {rating > 0 && (
                <button
                  onClick={handleSubmitFeedback}
                  className="w-full py-3 px-6 rounded-lg font-medium feedback-button feedback-action-button transition-all duration-200 hover:scale-105 touch-friendly"
                  style={{
                    backgroundColor: theme.colors.primary[500],
                    color: 'white',
                    minHeight: '48px'
                  }}
                >
                  Submit Feedback
                </button>
              )}

              {/* Optional Extra Features */}
              <div className="feedback-extra-buttons grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <button
                  className="feedback-extra-button py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 border touch-friendly"
                  style={{
                    borderColor: theme.colors.primary[300],
                    color: theme.colors.primary[600],
                    backgroundColor: 'transparent',
                    minHeight: '40px'
                  }}
                >
                  <Icon name="lightbulb" size="xs" className="mr-1" />
                  Suggest Feature
                </button>
                
                <button
                  className="feedback-extra-button py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 border touch-friendly"
                  style={{
                    borderColor: theme.colors.primary[300],
                    color: theme.colors.primary[600],
                    backgroundColor: 'transparent',
                    minHeight: '40px'
                  }}
                >
                  <Icon name="phone" size="xs" className="mr-1" />
                  Request Callback
                </button>
                
                <button
                  className="feedback-extra-button py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 border touch-friendly"
                  style={{
                    borderColor: theme.colors.primary[300],
                    color: theme.colors.primary[600],
                    backgroundColor: 'transparent',
                    minHeight: '40px'
                  }}
                >
                  <Icon name="help" size="xs" className="mr-1" />
                  Need Help?
                </button>
              </div>
            </div>

            {/* Premium Touch */}
            <div className="mt-6 pt-4 border-t" style={{ borderTopColor: theme.semantic.border.light }}>
              <p 
                className="text-xs flex items-center justify-center"
                style={{ color: theme.semantic.text.tertiary }}
              >
                <Icon name="heart" size="xs" className="mr-1" style={{ color: theme.colors.accent[500] }} />
                Made with love for your perfect wedding
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FeedbackSection;