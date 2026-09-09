import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const Language = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const languages = [
    {
      code: 'en-IN',
      name: 'English (India)',
      nativeName: 'English',
      flag: '🇮🇳',
      isPopular: true
    },
    {
      code: 'hi-IN',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      flag: '🇮🇳',
      isPopular: true
    },
    {
      code: 'mr-IN',
      name: 'Marathi',
      nativeName: 'मराठी',
      flag: '🇮🇳',
      isPopular: true
    },
    {
      code: 'gu-IN',
      name: 'Gujarati',
      nativeName: 'ગુજરાતી',
      flag: '🇮🇳',
      isPopular: true
    },
    {
      code: 'pa-IN',
      name: 'Punjabi',
      nativeName: 'ਪੰਜਾਬੀ',
      flag: '🇮🇳',
      isPopular: true
    },
    {
      code: 'bn-IN',
      name: 'Bengali',
      nativeName: 'বাংলা',
      flag: '🇮🇳',
      isPopular: true
    },
    {
      code: 'ta-IN',
      name: 'Tamil',
      nativeName: 'தமிழ்',
      flag: '🇮🇳',
      isPopular: false
    },
    {
      code: 'te-IN',
      name: 'Telugu',
      nativeName: 'తెలుగు',
      flag: '🇮🇳',
      isPopular: false
    },
    {
      code: 'kn-IN',
      name: 'Kannada',
      nativeName: 'ಕನ್ನಡ',
      flag: '🇮🇳',
      isPopular: false
    },
    {
      code: 'ml-IN',
      name: 'Malayalam',
      nativeName: 'മലയാളം',
      flag: '🇮🇳',
      isPopular: false
    },
    {
      code: 'or-IN',
      name: 'Odia',
      nativeName: 'ଓଡ଼ିଆ',
      flag: '🇮🇳',
      isPopular: false
    },
    {
      code: 'as-IN',
      name: 'Assamese',
      nativeName: 'অসমীয়া',
      flag: '🇮🇳',
      isPopular: false
    }
  ];

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
  };

  const handleSaveLanguage = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      // Simulate API call to save language preference
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage
      localStorage.setItem('selectedLanguage', selectedLanguage);
      
      // In a real app, you would also update the user's profile on the server
      // and potentially reload the app with the new language
      
      setMessage('Language preference saved successfully!');
      
      // Auto-hide message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
      
    } catch (error) {
      setMessage('Failed to save language preference. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguageInfo = (code) => {
    return languages.find(lang => lang.code === code);
  };

  const popularLanguages = languages.filter(lang => lang.isPopular);
  const otherLanguages = languages.filter(lang => !lang.isPopular);

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
              Language Settings
            </h1>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Choose your preferred language
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {message && (
          <div 
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes('successfully') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Current Language */}
        <Card className="mb-6">
          <div className="p-4">
            <h3 className="font-semibold mb-3" style={{ color: theme.semantic.text.primary }}>
              Current Language
            </h3>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getLanguageInfo(selectedLanguage)?.flag}</span>
              <div>
                <p className="font-medium" style={{ color: theme.semantic.text.primary }}>
                  {getLanguageInfo(selectedLanguage)?.name}
                </p>
                <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                  {getLanguageInfo(selectedLanguage)?.nativeName}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Popular Languages */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3" style={{ color: theme.semantic.text.primary }}>
            Popular Languages
          </h3>
          <Card>
            <div className="divide-y" style={{ divideColor: theme.semantic.border.light }}>
              {popularLanguages.map((language, index) => (
                <div
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    index === 0 ? 'rounded-t-lg' : ''
                  } ${
                    index === popularLanguages.length - 1 ? 'rounded-b-lg' : ''
                  }`}
                  style={{
                    backgroundColor: selectedLanguage === language.code 
                      ? theme.colors.primary[50] 
                      : 'transparent'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{language.flag}</span>
                      <div>
                        <p className="font-medium" style={{ color: theme.semantic.text.primary }}>
                          {language.name}
                        </p>
                        <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                          {language.nativeName}
                        </p>
                      </div>
                    </div>
                    {selectedLanguage === language.code && (
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.colors.primary[500] }}
                      >
                        <Icon name="check" size="xs" style={{ color: 'white' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Other Languages */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3" style={{ color: theme.semantic.text.primary }}>
            Other Languages
          </h3>
          <Card>
            <div className="divide-y" style={{ divideColor: theme.semantic.border.light }}>
              {otherLanguages.map((language, index) => (
                <div
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    index === 0 ? 'rounded-t-lg' : ''
                  } ${
                    index === otherLanguages.length - 1 ? 'rounded-b-lg' : ''
                  }`}
                  style={{
                    backgroundColor: selectedLanguage === language.code 
                      ? theme.colors.primary[50] 
                      : 'transparent'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{language.flag}</span>
                      <div>
                        <p className="font-medium" style={{ color: theme.semantic.text.primary }}>
                          {language.name}
                        </p>
                        <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                          {language.nativeName}
                        </p>
                      </div>
                    </div>
                    {selectedLanguage === language.code && (
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.colors.primary[500] }}
                      >
                        <Icon name="check" size="xs" style={{ color: 'white' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Language Info */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                style={{ backgroundColor: theme.colors.accent[100] }}
              >
                <Icon name="lightbulb" size="sm" style={{ color: theme.colors.accent[600] }} />
              </div>
              <div>
                <h4 className="font-medium mb-2" style={{ color: theme.semantic.text.primary }}>
                  Language Support
                </h4>
                <div className="space-y-2 text-sm" style={{ color: theme.semantic.text.secondary }}>
                  <p>• Interface language will change immediately after saving</p>
                  <p>• Vendor content may still appear in their preferred language</p>
                  <p>• Some features may have limited translation coverage</p>
                  <p>• You can change your language preference anytime</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSaveLanguage}
          disabled={isLoading}
          className="w-full py-4 rounded-xl font-bold text-base"
          style={{
            backgroundColor: theme.colors.primary[500],
            color: 'white',
            minHeight: '56px'
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Icon name="check" size="sm" />
              <span>Save Language Preference</span>
            </div>
          )}
        </Button>

        {/* Additional Options */}
        <div className="mt-6 space-y-3">
          <Button
            onClick={() => {
              // Reset to system language
              const systemLang = navigator.language || 'en-IN';
              const supportedLang = languages.find(lang => lang.code === systemLang)?.code || 'en-IN';
              setSelectedLanguage(supportedLang);
            }}
            variant="outline"
            className="w-full"
          >
            <Icon name="refresh" size="sm" className="mr-2" />
            Use System Language
          </Button>
          
          <Button
            onClick={() => navigate('/user/help')}
            variant="outline"
            className="w-full"
          >
            <Icon name="help" size="sm" className="mr-2" />
            Language Support Help
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Language;