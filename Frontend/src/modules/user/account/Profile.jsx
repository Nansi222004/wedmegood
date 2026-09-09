import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const Profile = () => {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user?.name || 'Priya Sharma',
    email: user?.email || 'priya.sharma@email.com',
    phone: user?.phone || '+91 98765 43210',
    city: user?.city || 'Indore',
    weddingDate: user?.weddingDate || '2024-12-15',
    monthlyIncome: user?.monthlyIncome || 75000,
    profileImage: user?.profileImage || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monthlyIncome' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user profile in auth context
      updateUser(formData);
      
      setMessage('Profile updated successfully!');
      setTimeout(() => {
        navigate('/user/account');
      }, 1500);
    } catch (error) {
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
              Edit Profile
            </h1>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Update your personal information
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {message && (
          <div 
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <Card>
          <div className="p-6">
            {/* Profile Image */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <img
                  src={formData.profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <button
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.primary[500] }}
                >
                  <Icon name="camera" size="xs" style={{ color: 'white' }} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required
              />

              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter your city"
                required
              />

              <Input
                label="Wedding Date"
                type="date"
                name="weddingDate"
                value={formData.weddingDate}
                onChange={handleChange}
                required
              />

              <Input
                label="Monthly Income (₹)"
                type="number"
                name="monthlyIncome"
                value={formData.monthlyIncome}
                onChange={handleChange}
                placeholder="Enter your monthly income"
                min="0"
              />

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                  style={{
                    backgroundColor: theme.colors.primary[500],
                    color: 'white'
                  }}
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;