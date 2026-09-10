import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const Contact = () => {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    phone: user?.phone || '+91 98765 43210',
    email: user?.email || 'priya.sharma@email.com',
    newPhone: '',
    newEmail: '',
    otp: ''
  });
  
  const [step, setStep] = useState('select'); // select, verify, success
  const [changeType, setChangeType] = useState(''); // phone or email
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePhone = () => {
    setChangeType('phone');
    setStep('verify');
  };

  const handleChangeEmail = () => {
    setChangeType('email');
    setStep('verify');
  };

  const handleSendOTP = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      // Simulate OTP sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage(`OTP sent to ${changeType === 'phone' ? formData.newPhone : formData.newEmail}`);
    } catch (error) {
      setMessage('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setMessage('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update profile
      const updatedData = {
        ...user,
        [changeType]: changeType === 'phone' ? formData.newPhone : formData.newEmail
      };
      updateUser(updatedData);
      
      setStep('success');
    } catch (error) {
      setMessage('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSelectStep = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.colors.primary[100] }}
            >
              <Icon name="phone" size="sm" style={{ color: theme.colors.primary[600] }} />
            </div>
            <div>
              <h3 className="font-medium" style={{ color: theme.semantic.text.primary }}>
                Phone Number
              </h3>
              <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                {formData.phone}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleChangePhone}
          >
            Change
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.colors.secondary[100] }}
            >
              <Icon name="envelope" size="sm" style={{ color: theme.colors.secondary[600] }} />
            </div>
            <div>
              <h3 className="font-medium" style={{ color: theme.semantic.text.primary }}>
                Email Address
              </h3>
              <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                {formData.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleChangeEmail}
          >
            Change
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="font-semibold mb-4" style={{ color: theme.semantic.text.primary }}>
          {changeType === 'phone' ? 'Change Phone Number' : 'Change Email Address'}
        </h3>
        
        <div className="space-y-4">
          <Input
            label={changeType === 'phone' ? 'New Phone Number' : 'New Email Address'}
            type={changeType === 'phone' ? 'tel' : 'email'}
            name={changeType === 'phone' ? 'newPhone' : 'newEmail'}
            value={changeType === 'phone' ? formData.newPhone : formData.newEmail}
            onChange={handleChange}
            placeholder={changeType === 'phone' ? 'Enter new phone number' : 'Enter new email address'}
            required
          />

          <Button
            onClick={handleSendOTP}
            disabled={isLoading || !(changeType === 'phone' ? formData.newPhone : formData.newEmail)}
            className="w-full"
          >
            {isLoading ? 'Sending...' : 'Send OTP'}
          </Button>

          {message && !message.includes('Failed') && (
            <div className="mt-4">
              <Input
                label="Enter OTP"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
              />

              <Button
                onClick={handleVerifyOTP}
                disabled={isLoading || !formData.otp}
                className="w-full mt-3"
                style={{
                  backgroundColor: theme.colors.primary[500],
                  color: 'white'
                }}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderSuccessStep = () => (
    <Card className="p-6 text-center">
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: theme.colors.accent[100] }}
      >
        <Icon name="check" size="xl" style={{ color: theme.colors.accent[600] }} />
      </div>
      <h3 className="font-semibold mb-2" style={{ color: theme.semantic.text.primary }}>
        {changeType === 'phone' ? 'Phone Number Updated' : 'Email Address Updated'}
      </h3>
      <p className="text-sm mb-4" style={{ color: theme.semantic.text.secondary }}>
        Your {changeType} has been successfully updated.
      </p>
      <Button
        onClick={() => navigate('/user/account')}
        style={{
          backgroundColor: theme.colors.primary[500],
          color: 'white'
        }}
      >
        Back to Account
      </Button>
    </Card>
  );

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
            onClick={() => step === 'select' ? navigate(-1) : setStep('select')}
            className="mr-3 p-2 rounded-full"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: theme.semantic.text.primary }}>
              Change Contact Info
            </h1>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Update your phone number or email
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {message && (
          <div 
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes('sent') || message.includes('successfully') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {step === 'select' && renderSelectStep()}
        {step === 'verify' && renderVerifyStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
    </div>
  );
};

export default Contact;