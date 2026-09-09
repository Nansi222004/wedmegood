import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';

const Festivals = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState('all');

  const currentYear = new Date().getFullYear();

  const festivals = [
    { id: 1, name: 'Makar Sankranti', date: 'January 14, 2026', month: 'january', description: 'Harvest festival, auspicious for new beginnings', isAuspicious: true },
    { id: 2, name: 'Vasant Panchami', date: 'February 2, 2026', month: 'february', description: 'Dedicated to Goddess Saraswati, good for engagements', isAuspicious: true },
    { id: 3, name: 'Maha Shivaratri', date: 'February 26, 2026', month: 'february', description: 'Great night of Shiva, highly auspicious', isAuspicious: true },
    { id: 4, name: 'Holi', date: 'March 14, 2026', month: 'march', description: 'Festival of colors, avoid wedding ceremonies', isAuspicious: false },
    { id: 5, name: 'Ugadi', date: 'March 22, 2026', month: 'march', description: 'New Year, excellent for new beginnings', isAuspicious: true },
    { id: 6, name: 'Ram Navami', date: 'April 10, 2026', month: 'april', description: 'Birth of Lord Rama, auspicious day', isAuspicious: true },
    { id: 7, name: 'Akshaya Tritiya', date: 'May 2, 2026', month: 'may', description: 'Most auspicious day for weddings', isAuspicious: true },
    { id: 8, name: 'Buddha Purnima', date: 'May 16, 2026', month: 'may', description: 'Full moon day, good for ceremonies', isAuspicious: true },
    { id: 9, name: 'Rath Yatra', date: 'June 23, 2026', month: 'june', description: 'Chariot festival, avoid weddings', isAuspicious: false },
    { id: 10, name: 'Guru Purnima', date: 'July 13, 2026', month: 'july', description: 'Full moon, good for blessings', isAuspicious: true },
    { id: 11, name: 'Raksha Bandhan', date: 'August 9, 2026', month: 'august', description: 'Brother-sister bond, family celebrations', isAuspicious: true },
    { id: 12, name: 'Janmashtami', date: 'August 25, 2026', month: 'august', description: 'Birth of Lord Krishna', isAuspicious: true },
    { id: 13, name: 'Ganesh Chaturthi', date: 'September 13, 2026', month: 'september', description: 'Lord Ganesha festival, very auspicious', isAuspicious: true },
    { id: 14, name: 'Navratri Begins', date: 'October 5, 2026', month: 'october', description: 'Nine nights of Goddess worship', isAuspicious: true },
    { id: 15, name: 'Dussehra', date: 'October 14, 2026', month: 'october', description: 'Victory of good over evil', isAuspicious: true },
    { id: 16, name: 'Karwa Chauth', date: 'October 20, 2026', month: 'october', description: 'Married women fast for husbands', isAuspicious: true },
    { id: 17, name: 'Diwali', date: 'November 1, 2026', month: 'november', description: 'Festival of lights, avoid weddings', isAuspicious: false },
    { id: 18, name: 'Bhai Dooj', date: 'November 3, 2026', month: 'november', description: 'Brother-sister celebration', isAuspicious: true },
    { id: 19, name: 'Tulsi Vivah', date: 'November 15, 2026', month: 'november', description: 'Marriage season begins', isAuspicious: true },
    { id: 20, name: 'Christmas', date: 'December 25, 2026', month: 'december', description: 'Christian celebration', isAuspicious: true }
  ];

  const months = [
    { id: 'all', name: 'All Months' },
    { id: 'january', name: 'January' },
    { id: 'february', name: 'February' },
    { id: 'march', name: 'March' },
    { id: 'april', name: 'April' },
    { id: 'may', name: 'May' },
    { id: 'june', name: 'June' },
    { id: 'july', name: 'July' },
    { id: 'august', name: 'August' },
    { id: 'september', name: 'September' },
    { id: 'october', name: 'October' },
    { id: 'november', name: 'November' },
    { id: 'december', name: 'December' }
  ];

  const filteredFestivals = selectedMonth === 'all' 
    ? festivals 
    : festivals.filter(f => f.month === selectedMonth);

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
        <div className="flex items-center gap-3 mb-4">
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
              Festivals {currentYear}
            </h1>
            <p 
              className="text-sm"
              style={{ color: theme.semantic.text.secondary }}
            >
              Plan your wedding around auspicious dates
            </p>
          </div>
        </div>

        {/* Month Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {months.map((month) => (
            <button
              key={month.id}
              onClick={() => setSelectedMonth(month.id)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: selectedMonth === month.id 
                  ? theme.colors.primary[500] 
                  : theme.semantic.background.accent,
                color: selectedMonth === month.id 
                  ? 'white' 
                  : theme.semantic.text.primary
              }}
            >
              {month.name}
            </button>
          ))}
        </div>
      </div>

      {/* Festivals List */}
      <div className="px-4 py-4 space-y-3">
        {filteredFestivals.map((festival) => (
          <div
            key={festival.id}
            className="p-4 rounded-xl"
            style={{ 
              backgroundColor: theme.semantic.background.primary,
              border: `1px solid ${theme.semantic.border.primary}`,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 
                  className="text-base font-semibold mb-1"
                  style={{ color: theme.semantic.text.primary }}
                >
                  {festival.name}
                </h3>
                <p 
                  className="text-sm mb-2"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  {festival.date}
                </p>
                <p 
                  className="text-sm"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  {festival.description}
                </p>
              </div>
              <div 
                className="px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-3"
                style={{ 
                  backgroundColor: festival.isAuspicious 
                    ? theme.colors.secondary[100] 
                    : theme.colors.accent[100],
                  color: festival.isAuspicious 
                    ? theme.colors.secondary[700] 
                    : theme.colors.accent[700]
                }}
              >
                {festival.isAuspicious ? '✓ Auspicious' : '⚠ Avoid'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="px-4 pb-4">
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
                Planning Tip
              </h4>
              <p 
                className="text-xs"
                style={{ color: theme.colors.primary[600] }}
              >
                Consult with a priest or astrologer for personalized muhurat (auspicious timing) for your wedding ceremony.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Festivals;
