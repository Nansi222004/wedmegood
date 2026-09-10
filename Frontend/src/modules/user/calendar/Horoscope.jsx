import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Toast from '../../../components/ui/Toast';

const Horoscope = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedZodiac, setSelectedZodiac] = useState(null);
  const [showCompatibility, setShowCompatibility] = useState(false);
  const [partner1Sign, setPartner1Sign] = useState('');
  const [partner2Sign, setPartner2Sign] = useState('');
  const [compatibilityResult, setCompatibilityResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [dailyHoroscope, setDailyHoroscope] = useState(null);

  const API_KEY = 'FfyyUQOBQW7zz05uRDypb3lWY2zxiBiO2ZCtrUWl';
  const API_BASE_URL = '/api/astrology/v3-json/horoscope';

  const zodiacSigns = [
    { id: 'aries', name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19', element: 'Fire', color: '#FF6B6B' },
    { id: 'taurus', name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20', element: 'Earth', color: '#4ECDC4' },
    { id: 'gemini', name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20', element: 'Air', color: '#FFE66D' },
    { id: 'cancer', name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22', element: 'Water', color: '#95E1D3' },
    { id: 'leo', name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22', element: 'Fire', color: '#F38181' },
    { id: 'virgo', name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22', element: 'Earth', color: '#AA96DA' },
    { id: 'libra', name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22', element: 'Air', color: '#FCBAD3' },
    { id: 'scorpio', name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21', element: 'Water', color: '#A8D8EA' },
    { id: 'sagittarius', name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21', element: 'Fire', color: '#FFD93D' },
    { id: 'capricorn', name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19', element: 'Earth', color: '#6BCB77' },
    { id: 'aquarius', name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18', element: 'Air', color: '#4D96FF' },
    { id: 'pisces', name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20', element: 'Water', color: '#C3ACD0' }
  ];

  const fetchDailyHoroscope = async (sign) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/daily-sun?sign=${sign}&api_key=${API_KEY}&split=true&type=big&lang=en`);
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      
      if (data.status === 200 && data.response) {
        setDailyHoroscope(data.response);
      } else {
        // Use fallback data
        setDailyHoroscope({
          prediction: `Today brings positive energy for ${sign.name}. Focus on your goals and trust your intuition. Good opportunities may arise in personal relationships and career matters.`,
          split_prediction: {
            love: 'Romantic prospects look promising',
            career: 'Professional growth opportunities ahead',
            health: 'Maintain balance and wellness',
            finance: 'Financial stability continues'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching horoscope:', error);
      // Use fallback data on error
      setDailyHoroscope({
        prediction: `Today brings positive energy for ${sign.name}. Focus on your goals and trust your intuition. Good opportunities may arise in personal relationships and career matters.`,
        split_prediction: {
          love: 'Romantic prospects look promising',
          career: 'Professional growth opportunities ahead',
          health: 'Maintain balance and wellness',
          finance: 'Financial stability continues'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleZodiacSelect = (sign) => {
    setSelectedZodiac(sign);
    fetchDailyHoroscope(sign.id);
  };

  const handleCompatibilityCheck = async () => {
    if (!partner1Sign || !partner2Sign) {
      setToastMessage('Please select both zodiac signs');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/match-making?male_sign=${partner1Sign}&female_sign=${partner2Sign}&api_key=${API_KEY}&lang=en`
      );
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      
      if (data.status === 200 && data.response) {
        const matchData = data.response;
        setCompatibilityResult({
          score: matchData.total_score || Math.floor(Math.random() * 30) + 70,
          message: matchData.conclusion || 'Good compatibility! A harmonious relationship awaits.',
          traits: [
            `Overall Match: ${matchData.total_score || 'N/A'}/100`,
            `Emotional Connection: ${matchData.emotional_compatibility || 'Strong'}`,
            `Communication: ${matchData.communication || 'Excellent'}`,
            `Trust & Loyalty: ${matchData.trust || 'High'}`
          ],
          details: matchData
        });
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('Error checking compatibility:', error);
      // Use fallback data
      const score = Math.floor(Math.random() * 30) + 70;
      setCompatibilityResult({
        score,
        message: score >= 85 
          ? 'Excellent match! Your stars align beautifully.' 
          : score >= 75 
          ? 'Good compatibility! A harmonious relationship awaits.' 
          : 'Moderate compatibility. Communication is key.',
        traits: [
          'Emotional Connection: Strong',
          'Communication: Excellent',
          'Trust & Loyalty: High',
          'Shared Values: Compatible'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.semantic.background.secondary }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-40 px-4 py-4 border-b"
        style={{ 
          backgroundColor: theme.semantic.background.primary,
          borderBottomColor: theme.semantic.border.light
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full transition-colors"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <div>
            <h1 
              className="text-xl font-bold"
              style={{ color: theme.semantic.text.primary }}
            >
              Horoscope & Compatibility
            </h1>
            <p 
              className="text-sm"
              style={{ color: theme.semantic.text.secondary }}
            >
              Check your zodiac compatibility
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4">
        <div 
          className="flex gap-2 p-1 rounded-lg"
          style={{ backgroundColor: theme.semantic.background.accent }}
        >
          <button
            onClick={() => setShowCompatibility(false)}
            className="flex-1 py-2 rounded-md text-sm font-medium transition-all"
            style={{
              backgroundColor: !showCompatibility ? theme.colors.primary[500] : 'transparent',
              color: !showCompatibility ? 'white' : theme.semantic.text.primary
            }}
          >
            Zodiac Signs
          </button>
          <button
            onClick={() => setShowCompatibility(true)}
            className="flex-1 py-2 rounded-md text-sm font-medium transition-all"
            style={{
              backgroundColor: showCompatibility ? theme.colors.primary[500] : 'transparent',
              color: showCompatibility ? 'white' : theme.semantic.text.primary
            }}
          >
            Compatibility
          </button>
        </div>
      </div>

      {!showCompatibility ? (
        /* Zodiac Signs Grid */
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {zodiacSigns.map((sign) => (
              <button
                key={sign.id}
                onClick={() => handleZodiacSelect(sign)}
                className="p-4 rounded-xl transition-all active:scale-95"
                style={{ 
                  backgroundColor: theme.semantic.background.primary,
                  border: `2px solid ${selectedZodiac?.id === sign.id ? theme.colors.primary[500] : theme.semantic.border.primary}`,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}
              >
                <div 
                  className="text-3xl mb-2"
                  style={{ color: sign.color }}
                >
                  {sign.symbol}
                </div>
                <h3 
                  className="text-xs font-semibold mb-1"
                  style={{ color: theme.semantic.text.primary }}
                >
                  {sign.name}
                </h3>
                <p 
                  className="text-xs"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  {sign.dates}
                </p>
              </button>
            ))}
          </div>

          {/* Selected Zodiac Details */}
          {selectedZodiac && (
            <div 
              className="mt-4 p-4 rounded-xl"
              style={{ 
                backgroundColor: theme.semantic.background.primary,
                border: `1px solid ${theme.semantic.border.primary}`
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="text-4xl"
                  style={{ color: selectedZodiac.color }}
                >
                  {selectedZodiac.symbol}
                </div>
                <div>
                  <h3 
                    className="text-lg font-bold"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    {selectedZodiac.name}
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {selectedZodiac.dates} • {selectedZodiac.element}
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.colors.primary[500] }}></div>
                </div>
              ) : dailyHoroscope ? (
                <div className="space-y-3">
                  <div>
                    <h4 
                      className="text-sm font-semibold mb-1"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      Today's Horoscope
                    </h4>
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: theme.semantic.text.secondary }}
                    >
                      {dailyHoroscope.prediction || dailyHoroscope.bot_response || 'Your stars are aligned for a wonderful day ahead!'}
                    </p>
                  </div>
                  
                  {dailyHoroscope.split_prediction && (
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(dailyHoroscope.split_prediction).map(([key, value]) => (
                        <div 
                          key={key}
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: theme.semantic.background.accent }}
                        >
                          <p 
                            className="text-xs font-medium mb-1 capitalize"
                            style={{ color: theme.semantic.text.primary }}
                          >
                            {key.replace('_', ' ')}
                          </p>
                          <p 
                            className="text-xs"
                            style={{ color: theme.semantic.text.secondary }}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p 
                  className="text-sm"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  Element: {selectedZodiac.element} signs are known for their passionate and dynamic nature. Perfect for couples who value adventure and spontaneity in their relationship.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Compatibility Checker */
        <div className="px-4 pb-4 space-y-4">
          <div 
            className="p-4 rounded-xl"
            style={{ 
              backgroundColor: theme.semantic.background.primary,
              border: `1px solid ${theme.semantic.border.primary}`
            }}
          >
            <h3 
              className="text-base font-semibold mb-3"
              style={{ color: theme.semantic.text.primary }}
            >
              Check Compatibility
            </h3>
            
            <div className="space-y-3">
              <div>
                <label 
                  className="text-sm font-medium mb-1 block"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  Partner 1 Zodiac Sign
                </label>
                <select
                  value={partner1Sign}
                  onChange={(e) => setPartner1Sign(e.target.value)}
                  className="w-full p-3 rounded-lg text-sm"
                  style={{ 
                    backgroundColor: theme.semantic.background.accent,
                    border: `1px solid ${theme.semantic.border.primary}`,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="">Select zodiac sign</option>
                  {zodiacSigns.map((sign) => (
                    <option key={sign.id} value={sign.id}>
                      {sign.symbol} {sign.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label 
                  className="text-sm font-medium mb-1 block"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  Partner 2 Zodiac Sign
                </label>
                <select
                  value={partner2Sign}
                  onChange={(e) => setPartner2Sign(e.target.value)}
                  className="w-full p-3 rounded-lg text-sm"
                  style={{ 
                    backgroundColor: theme.semantic.background.accent,
                    border: `1px solid ${theme.semantic.border.primary}`,
                    color: theme.semantic.text.primary
                  }}
                >
                  <option value="">Select zodiac sign</option>
                  {zodiacSigns.map((sign) => (
                    <option key={sign.id} value={sign.id}>
                      {sign.symbol} {sign.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCompatibilityCheck}
                disabled={!partner1Sign || !partner2Sign || loading}
                className="w-full py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: theme.colors.primary[500],
                  color: 'white'
                }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Checking...</span>
                  </>
                ) : (
                  'Check Compatibility'
                )}
              </button>
            </div>
          </div>

          {/* Compatibility Result */}
          {compatibilityResult && (
            <div 
              className="p-4 rounded-xl"
              style={{ 
                backgroundColor: theme.colors.secondary[50],
                border: `1px solid ${theme.colors.secondary[200]}`
              }}
            >
              <div className="text-center mb-4">
                <div 
                  className="text-4xl font-bold mb-2"
                  style={{ color: theme.colors.secondary[600] }}
                >
                  {compatibilityResult.score}%
                </div>
                <p 
                  className="text-sm font-medium"
                  style={{ color: theme.colors.secondary[700] }}
                >
                  {compatibilityResult.message}
                </p>
              </div>

              <div className="space-y-2">
                {compatibilityResult.traits.map((trait, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 text-sm"
                    style={{ color: theme.colors.secondary[600] }}
                  >
                    <span>✓</span>
                    <span>{trait}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div 
            className="p-4 rounded-xl"
            style={{ 
              backgroundColor: theme.colors.primary[50],
              border: `1px solid ${theme.colors.primary[200]}`
            }}
          >
            <div className="flex gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.colors.primary[100] }}
              >
                <Icon name="info" size="sm" style={{ color: theme.colors.primary[600] }} />
              </div>
              <div>
                <h4 
                  className="text-sm font-semibold mb-1"
                  style={{ color: theme.colors.primary[700] }}
                >
                  Note
                </h4>
                <p 
                  className="text-xs"
                  style={{ color: theme.colors.primary[600] }}
                >
                  This is a basic compatibility check. For detailed horoscope matching (Kundli Milan), please consult with a professional astrologer.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default Horoscope;
