import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';

const BudgetPlanner = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [budgetData, setBudgetData] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [tempFinancials, setTempFinancials] = useState({});

  // Load budget data from localStorage
  useEffect(() => {
    const savedBudgetData = localStorage.getItem('budgetData');
    if (savedBudgetData) {
      setBudgetData(JSON.parse(savedBudgetData));
    } else {
      // Get user's actual budget from event details
      const savedEventData = localStorage.getItem('eventDetails');
      let userBudget = 500000; // Default fallback

      if (savedEventData) {
        const eventData = JSON.parse(savedEventData);
        userBudget = parseInt(eventData.details?.budget) || 500000;
      }

      // Create budget data based on user's actual budget
      const budgetData = {
        totalBudget: userBudget,
        spentAmount: 0,
        remainingAmount: userBudget,
        categories: [
          {
            name: 'Venue',
            totalAmount: Math.floor(userBudget * 0.4),
            advancePaid: 0,
            balanceAmount: Math.floor(userBudget * 0.4),
            spent: 0,
            color: '#ec4899'
          },
          {
            name: 'Catering',
            totalAmount: Math.floor(userBudget * 0.25),
            advancePaid: 0,
            balanceAmount: Math.floor(userBudget * 0.25),
            spent: 0,
            color: '#10b981'
          },
          {
            name: 'Photography',
            totalAmount: Math.floor(userBudget * 0.15),
            advancePaid: 0,
            balanceAmount: Math.floor(userBudget * 0.15),
            spent: 0,
            color: '#f59e0b'
          },
          {
            name: 'Decoration',
            totalAmount: Math.floor(userBudget * 0.1),
            advancePaid: 0,
            balanceAmount: Math.floor(userBudget * 0.1),
            spent: 0,
            color: '#8b5cf6'
          },
          {
            name: 'Makeup',
            totalAmount: Math.floor(userBudget * 0.05),
            advancePaid: 0,
            balanceAmount: Math.floor(userBudget * 0.05),
            spent: 0,
            color: '#06b6d4'
          },
          {
            name: 'Others',
            totalAmount: Math.floor(userBudget * 0.05),
            advancePaid: 0,
            balanceAmount: Math.floor(userBudget * 0.05),
            spent: 0,
            color: '#ef4444'
          }
        ]
      };

      setBudgetData(budgetData);
      localStorage.setItem('budgetData', JSON.stringify(budgetData));
    }
  }, []);

  // Handle vendor navigation
  const handleVendorNavigation = (categoryName) => {
    // Convert category name to URL-friendly format
    const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/user/vendors/${categorySlug}`);
  };

  // Update category financials
  const updateCategoryFinancials = (categoryName, field, value) => {
    const numValue = parseInt(value.replace(/[₹,]/g, '')) || 0;

    setTempFinancials(prev => ({
      ...prev,
      [categoryName]: {
        ...prev[categoryName],
        [field]: numValue
      }
    }));
  };

  // Save category financials
  const saveCategoryFinancials = (categoryName) => {
    const financials = tempFinancials[categoryName];
    if (!financials) return;

    const updatedCategories = budgetData.categories.map(cat => {
      if (cat.name === categoryName) {
        const updatedCat = {
          ...cat,
          advancePaid: financials.advancePaid || cat.advancePaid,
          balanceAmount: financials.balanceAmount || cat.balanceAmount,
          spent: financials.advancePaid || cat.advancePaid // Update spent to match advance paid
        };
        return updatedCat;
      }
      return cat;
    });

    // Recalculate totals
    const totalSpent = updatedCategories.reduce((sum, cat) => sum + cat.spent, 0);
    const totalBudget = updatedCategories.reduce((sum, cat) => sum + cat.totalAmount, 0);

    const updatedBudgetData = {
      ...budgetData,
      categories: updatedCategories,
      spentAmount: totalSpent,
      remainingAmount: totalBudget - totalSpent
    };

    setBudgetData(updatedBudgetData);
    localStorage.setItem('budgetData', JSON.stringify(updatedBudgetData));

    // Also update planning categories
    updatePlanningCategories(categoryName, financials);

    setEditingCategory(null);
    setTempFinancials(prev => {
      const newState = { ...prev };
      delete newState[categoryName];
      return newState;
    });
  };

  // Update planning categories with financial data
  const updatePlanningCategories = (categoryName, financials) => {
    const savedCategories = localStorage.getItem('planningCategories');
    if (savedCategories) {
      const categories = JSON.parse(savedCategories);
      const updatedCategories = categories.map(cat => {
        if (cat.name === categoryName) {
          return {
            ...cat,
            advancePaid: `₹${financials.advancePaid?.toLocaleString() || cat.advancePaid}`,
            balanceAmount: `₹${financials.balanceAmount?.toLocaleString() || cat.balanceAmount}`,
            status: 'Confirmed'
          };
        }
        return cat;
      });
      localStorage.setItem('planningCategories', JSON.stringify(updatedCategories));
    }
  };

  // Start editing category
  const startEditingCategory = (category) => {
    setEditingCategory(category.name);
    setTempFinancials(prev => ({
      ...prev,
      [category.name]: {
        advancePaid: category.advancePaid,
        balanceAmount: category.balanceAmount
      }
    }));
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingCategory(null);
    setTempFinancials({});
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };

  const handleBack = () => {
    navigate('/user/planning-dashboard');
  };

  // Calculate percentages for progress bars
  const getPercentage = (value, total) => ((value / total) * 100).toFixed(1);

  if (!budgetData) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="text-center px-4">
          <Icon name="money" size="xl" style={{ color: theme.colors.primary[300] }} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
            No Budget Data
          </h2>
          <p className="text-sm mb-6" style={{ color: theme.semantic.text.secondary }}>
            Complete your event form to see budget analytics
          </p>
          <button
            onClick={() => navigate('/user/requirements')}
            className="px-6 py-3 rounded-lg font-medium"
            style={{ backgroundColor: theme.colors.primary[500], color: 'white' }}
          >
            Set Up Budget
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="mr-3 p-2 rounded-full"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: theme.semantic.text.primary }}>
              Budget Planner
            </h1>
            <p className="text-sm mt-1" style={{ color: theme.semantic.text.secondary }}>
              Track your wedding expenses and budget
            </p>
          </div>
        </div>

        {/* Budget Summary */}
        <div className="px-4 mb-6">
          <div className="bg-white rounded-xl p-6" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
            <div className="flex justify-between items-end text-center h-[90px]">
              <div className="flex-1 flex flex-col justify-between h-full">
                <p className="text-[11px] leading-tight font-medium text-gray-500 mb-1">Total Budget</p>
                <p className="text-[22px] font-black" style={{ color: theme.colors.primary[600] }}>
                  ₹{(budgetData.totalBudget / 1000).toFixed(0)}K
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-between h-full px-1 border-gray-100">
                <p className="text-[11px] leading-tight font-medium text-gray-500 mb-1">
                  Advance Paid<br />for the<br />Vendors
                </p>
                <p className="text-[22px] font-black text-amber-500">
                  ₹{(budgetData.spentAmount / 1000).toFixed(0)}K
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-between h-full">
                <p className="text-[11px] leading-tight font-medium text-gray-500 mb-1">
                  Balance<br />Amount to be<br />Paid
                </p>
                <p className="text-[22px] font-black text-emerald-600">
                  ₹{(budgetData.remainingAmount / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Utilization */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-xl p-6" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: theme.semantic.text.primary }}>
            Budget Utilization
          </h3>
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
              <div
                className="h-4 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${getPercentage(budgetData.spentAmount, budgetData.totalBudget)}%`,
                  background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
                }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: theme.semantic.text.secondary }}>
                {getPercentage(budgetData.spentAmount, budgetData.totalBudget)}% Paid
              </span>
              <span style={{ color: theme.semantic.text.secondary }}>
                ₹{budgetData.spentAmount.toLocaleString()} / ₹{budgetData.totalBudget.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Spending */}
      <div className="px-4">
        <div className="bg-white rounded-xl p-6" style={{ boxShadow: `0 4px 15px -3px ${theme.semantic.card.shadow}40` }}>
          <h3 className="font-bold text-lg mb-6" style={{ color: theme.semantic.text.primary }}>
            Category Spending
          </h3>
          <div className="space-y-6">
            {budgetData.categories.map((category, index) => (
              <div key={category.name} className="border-b border-gray-100 pb-6 last:border-b-0">
                {/* Category Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-base font-medium" style={{ color: theme.semantic.text.primary }}>
                      {category.name}
                    </span>
                  </div>
                  <span className="text-base font-medium" style={{ color: theme.semantic.text.primary }}>
                    ₹{category.spent.toLocaleString()} / ₹{category.totalAmount.toLocaleString()}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${getPercentage(category.spent, category.totalAmount)}%`,
                      backgroundColor: category.color,
                      animationDelay: `${index * 200}ms`
                    }}
                  />
                </div>

                {/* Three Fields: Total Amount, Advance Paid, Balance Amount */}
                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${category.color}10` }}>
                    <p className="font-medium mb-1" style={{ color: theme.semantic.text.secondary }}>
                      Total Amount
                    </p>
                    <p className="font-bold text-base" style={{ color: category.color }}>
                      ₹{(category.totalAmount / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${category.color}10` }}>
                    <p className="font-medium mb-1" style={{ color: theme.semantic.text.secondary }}>
                      Advance Paid
                    </p>
                    <p className="font-bold text-base" style={{ color: category.color }}>
                      ₹{(category.advancePaid / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${category.color}10` }}>
                    <p className="font-medium mb-1" style={{ color: theme.semantic.text.secondary }}>
                      Balance Amount
                    </p>
                    <p className="font-bold text-base" style={{ color: category.color }}>
                      ₹{(category.balanceAmount / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>

                {/* Vendor Button */}
                <button
                  onClick={() => handleVendorNavigation(category.name)}
                  className="w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                    border: `1px solid ${category.color}40`
                  }}
                >
                  Find {category.name} Vendors →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default BudgetPlanner;