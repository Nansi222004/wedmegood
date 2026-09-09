import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import WeddingDetailsForm from './WeddingDetailsForm';

const RequirementsForm = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const location = useLocation();

  useEffect(() => {
    // If we're explicitly in edit mode (coming from back button), don't redirect
    if (location.state?.editMode) return;

    const saved = localStorage.getItem('eventDetails');
    if (saved && saved !== 'null' && saved !== 'undefined') {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          navigate('/user/planning-dashboard', { replace: true });
        }
      } catch (e) {
        // Data is corrupted, let them fill it again
        localStorage.removeItem('eventDetails');
      }
    }
  }, [navigate, location.state]);

  const handleBack = () => {
    navigate('/user/home');
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header Section */}
      <div className="px-4 py-6">
        <div className="flex items-center mb-4">
          <button
            onClick={handleBack}
            className="mr-3 p-2 rounded-full"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: theme.semantic.text.primary }}
            >
              Plan Your Event
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: theme.semantic.text.secondary }}
            >
              Fill in your event details to get personalized recommendations
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 mb-6">
          <div
            className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: theme.colors.primary[500] }}
          />
          <div
            className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: theme.semantic.border.light }}
          />
          <div
            className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: theme.semantic.border.light }}
          />
        </div>
      </div>

      {/* Wedding Details Form */}
      <WeddingDetailsForm />
    </div>
  );
};

export default RequirementsForm;