import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { userApi } from '../../../services/userApi';

const Profile = () => {
  const { theme } = useTheme();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    weddingDate: '',
    profileImage: ''
  });
  
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const formatImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Security & Account Management states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState({ password: '', confirmation: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      await userApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 1800);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password. Please verify current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (deleteData.confirmation !== 'DELETE') {
      setDeleteError('Please type "DELETE" exactly to confirm.');
      return;
    }

    if (!deleteData.password) {
      setDeleteError('Password is required to delete account.');
      return;
    }

    setDeleteLoading(true);
    try {
      await userApi.deleteAccount(deleteData.password, 'DELETE');
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Please verify your password.');
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setIsFetching(true);
        const res = await userApi.getUserProfile();
        if (res.success && res.data?.user && isMounted) {
          const u = res.data.user;
          const formattedDate = u.weddingDate ? new Date(u.weddingDate).toISOString().split('T')[0] : '';
          setFormData({
            name: u.name || '',
            email: u.email || '',
            phone: u.phone || '',
            city: u.city || '',
            weddingDate: formattedDate,
            profileImage: u.profileImage || ''
          });
        }
      } catch (err) {
        if (isMounted) {
          // If API fails, fall back to current auth session user
          if (user) {
            const formattedDate = user.weddingDate ? new Date(user.weddingDate).toISOString().split('T')[0] : '';
            setFormData({
              name: user.name || '',
              email: user.email || '',
              phone: user.phone || '',
              city: user.city || '',
              weddingDate: formattedDate,
              profileImage: user.profileImage || ''
            });
          }
          setMessage(err.message || 'Failed to load profile data');
          setMessageType('error');
        }
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file');
      setMessageType('error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5MB');
      setMessageType('error');
      return;
    }

    try {
      setIsUploading(true);
      setMessage('');
      const res = await userApi.uploadImage(file);
      const imageUrl = res.data?.url || res.url;
      if (imageUrl) {
        setFormData(prev => ({ ...prev, profileImage: imageUrl }));
        // Automatically save new avatar to MongoDB and AuthContext so it persists immediately
        try {
          const updateRes = await userApi.updateUserProfile({ profileImage: imageUrl });
          if (updateRes.success && updateRes.data?.user) {
            updateUser(updateRes.data.user);
            setMessage('Profile photo updated and saved successfully!');
            setMessageType('success');
          } else {
            setMessage('Image uploaded! Click "Update Profile" to save.');
            setMessageType('success');
          }
        } catch (saveErr) {
          setMessage('Image uploaded! Click "Update Profile" below to save.');
          setMessageType('success');
        }
      } else {
        throw new Error('No image URL returned by upload server');
      }
    } catch (err) {
      setMessage(err.message || 'Failed to upload profile image');
      setMessageType('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const payload = {
        name: formData.name ? formData.name.trim() : '',
        phone: formData.phone ? formData.phone.trim() : '',
        city: formData.city ? formData.city.trim() : '',
        weddingDate: formData.weddingDate ? formData.weddingDate : null
      };

      if (formData.profileImage && formData.profileImage.trim()) {
        payload.profileImage = formData.profileImage.trim();
      }

      const res = await userApi.updateUserProfile(payload);
      
      if (res.success && res.data?.user) {
        updateUser(res.data.user);
        setMessage('Profile updated successfully in MongoDB!');
        setMessageType('success');
        setTimeout(() => {
          navigate('/user/account');
        }, 1200);
      } else {
        throw new Error(res.message || 'Failed to update profile');
      }
    } catch (error) {
      setMessage(error.message || 'Failed to update profile. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium" style={{ color: theme.semantic.text.secondary }}>Loading profile...</p>
        </div>
      </div>
    );
  }

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

      <div className="px-4 py-6 max-w-xl mx-auto">
        {message && (
          <div 
            className={`mb-4 p-3 rounded-lg text-sm ${
              messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
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
                {formData.profileImage ? (
                  <img
                    src={formatImageUrl(formData.profileImage)}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-3xl font-bold border-4 border-white shadow-lg">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  aria-label="Upload profile image"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: theme.colors.primary[500] }}
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Icon name="camera" size="xs" style={{ color: 'white' }} />
                  )}
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: theme.semantic.text.secondary }}>
                {isUploading ? 'Uploading to cloud...' : 'Click camera to change photo'}
              </p>
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
                label="Email (Account ID)"
                type="email"
                name="email"
                value={formData.email}
                disabled
                placeholder="Enter your email"
              />

              <Input
                label="Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />

              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter your city"
              />

              <Input
                label="Wedding Date"
                type="date"
                name="weddingDate"
                value={formData.weddingDate}
                onChange={handleChange}
              />

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading || isUploading}
                  style={{
                    backgroundColor: theme.colors.primary[500],
                    color: 'white'
                  }}
                >
                  {isLoading ? 'Saving to Database...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Security & Password */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base" style={{ color: theme.semantic.text.primary }}>
                  Account Security
                </h3>
                <p className="text-xs mt-1" style={{ color: theme.semantic.text.secondary }}>
                  Update your password to keep your wedding planning data protected.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                variant="outline"
                className="px-4 py-2 text-xs font-semibold"
              >
                Change Password
              </Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card>
          <div className="p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-red-600">
                  Danger Zone
                </h3>
                <p className="text-xs mt-1" style={{ color: theme.semantic.text.secondary }}>
                  Permanently deactivate your user profile, saved vendors, and planning data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </Card>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4" style={{ backgroundColor: theme.semantic.card.background }}>
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-base" style={{ color: theme.semantic.text.primary }}>
                  Change Account Password
                </h4>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>

              {passwordError && (
                <div className="p-2.5 rounded-lg bg-red-100 text-red-600 text-xs font-semibold">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold">
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: theme.semantic.text.secondary }}>
                    Current Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none"
                    style={{ borderColor: theme.semantic.card.border, color: theme.semantic.text.primary, backgroundColor: theme.semantic.background.primary }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: theme.semantic.text.secondary }}>
                    New Password * (Min. 8 chars, 1 uppercase, 1 digit)
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none"
                    style={{ borderColor: theme.semantic.card.border, color: theme.semantic.text.primary, backgroundColor: theme.semantic.background.primary }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: theme.semantic.text.secondary }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none"
                    style={{ borderColor: theme.semantic.card.border, color: theme.semantic.text.primary, backgroundColor: theme.semantic.background.primary }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-xs rounded-lg border font-medium"
                    style={{ borderColor: theme.semantic.border.light, color: theme.semantic.text.secondary }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-5 py-2 text-xs rounded-lg text-white font-bold"
                    style={{ backgroundColor: theme.colors.primary[500] }}
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 bg-white">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-base text-red-600">
                  Delete Account Confirmation
                </h4>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>

              <p className="text-xs text-gray-600">
                This action is permanent and irreversible. Your account and personal wedding data will be deactivated.
              </p>

              {deleteError && (
                <div className="p-2.5 rounded-lg bg-red-100 text-red-600 text-xs font-semibold">
                  {deleteError}
                </div>
              )}

              <form onSubmit={handleDeleteAccount} className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1 text-gray-700">
                    Enter your account password:
                  </label>
                  <input
                    type="password"
                    required
                    value={deleteData.password}
                    onChange={(e) => setDeleteData({ ...deleteData, password: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1 text-gray-700">
                    Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    required
                    value={deleteData.confirmation}
                    onChange={(e) => setDeleteData({ ...deleteData, confirmation: e.target.value })}
                    placeholder="DELETE"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 font-mono font-bold"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-xs rounded-lg border border-gray-300 text-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading || deleteData.confirmation !== 'DELETE' || !deleteData.password}
                    className="px-5 py-2 text-xs rounded-lg text-white font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deleteLoading ? 'Deactivating...' : 'Confirm Delete Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;