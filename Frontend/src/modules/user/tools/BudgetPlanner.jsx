import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import { userApi } from '../../../services/userApi';

const BudgetPlanner = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [budgetData, setBudgetData] = useState(null);
  const [authoritativeTx, setAuthoritativeTx] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [tempFinancials, setTempFinancials] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load budget data from Backend API
  const fetchBudget = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await userApi.getBudget();
      if (res.success && res.data?.budget) {
        setBudgetData(res.data.budget);
        setAuthoritativeTx(res.data.authoritativeTransactions || null);
      }
    } catch (err) {
      console.error('Failed to load budget:', err);
      setError(err.message || 'Failed to load budget details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, []);

  // Handle vendor navigation
  const handleVendorNavigation = (categoryName) => {
    const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/user/vendors/${categorySlug}`);
  };

  // Update category financials
  const updateCategoryFinancials = (categoryName, field, value) => {
    const numValue = parseInt(String(value).replace(/[₹,]/g, ''), 10) || 0;

    setTempFinancials(prev => ({
      ...prev,
      [categoryName]: {
        ...prev[categoryName],
        [field]: numValue
      }
    }));
  };

  // Save category financials to Backend
  const saveCategoryFinancials = async (categoryName) => {
    const financials = tempFinancials[categoryName];
    if (!financials || !budgetData) return;

    try {
      setIsSaving(true);
      const updatedCategories = budgetData.categories.map(cat => {
        if (cat.name === categoryName) {
          const advance = financials.advancePaid !== undefined ? financials.advancePaid : cat.advancePaid;
          const balance = financials.balanceAmount !== undefined ? financials.balanceAmount : cat.balanceAmount;
          return {
            ...cat,
            advancePaid: advance,
            balanceAmount: balance,
            spent: advance,
            status: advance > 0 ? 'Confirmed' : cat.status
          };
        }
        return cat;
      });

      const res = await userApi.updateBudget({
        totalBudget: budgetData.totalBudget,
        categories: updatedCategories,
        notes: budgetData.notes
      });

      if (res.success && res.data?.budget) {
        setBudgetData(res.data.budget);
      }

      setEditingCategory(null);
      setTempFinancials(prev => {
        const newState = { ...prev };
        delete newState[categoryName];
        return newState;
      });
    } catch (err) {
      console.error('Failed to save category financials:', err);
      alert(err.message || 'Failed to update category');
    } finally {
      setIsSaving(false);
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
    return `₹${Number(amount || 0).toLocaleString()}`;
  };

  const handleBack = () => {
    navigate('/user/planning-dashboard');
  };

  // Calculate percentages for progress bars
  const getPercentage = (value, total) => (total > 0 ? ((value / total) * 100).toFixed(1) : 0);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium" style={{ color: theme.semantic.text.secondary }}>
            Loading your wedding budget...
          </p>
        </div>
      </div>
    );
  }

  if (error || !budgetData) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="text-center px-4 max-w-sm">
          <Icon name="money" size="xl" style={{ color: theme.colors.primary[300] }} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
            {error ? 'Unable to load budget' : 'No Budget Data'}
          </h2>
          <p className="text-sm mb-6" style={{ color: theme.semantic.text.secondary }}>
            {error || 'Start setting up your wedding budget allocations'}
          </p>
          <button
            onClick={fetchBudget}
            className="px-6 py-3 rounded-lg font-medium shadow-md transition-all active:scale-95"
            style={{ backgroundColor: theme.colors.primary[500], color: 'white' }}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const totalSpent = budgetData.categories?.reduce((sum, c) => sum + (Number(c.spent) || 0), 0) || 0;
  const totalBalance = Math.max(0, (budgetData.totalBudget || 0) - totalSpent);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="mr-3 p-2 rounded-full transition-transform active:scale-95"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: theme.semantic.text.primary }}>
              Budget Planner
            </h1>
            <p className="text-sm mt-1" style={{ color: theme.semantic.text.secondary }}>
              Track your wedding expenses and live booking financial sync
            </p>
          </div>
        </div>

        {/* Budget Summary Card */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
            <div className="flex justify-between items-end text-center h-[90px]">
              <div className="flex-1 flex flex-col justify-between h-full">
                <p className="text-[11px] leading-tight font-medium text-gray-500 mb-1">Total Budget</p>
                <p className="text-[22px] font-black" style={{ color: theme.colors.primary[600] }}>
                  ₹{((budgetData.totalBudget || 0) / 1000).toFixed(0)}K
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-between h-full px-1 border-x border-gray-100">
                <p className="text-[11px] leading-tight font-medium text-gray-500 mb-1">
                  Advance Paid<br />to Vendors
                </p>
                <p className="text-[22px] font-black text-amber-500">
                  ₹{(totalSpent / 1000).toFixed(0)}K
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-between h-full">
                <p className="text-[11px] leading-tight font-medium text-gray-500 mb-1">
                  Remaining<br />Allocation
                </p>
                <p className="text-[22px] font-black text-emerald-600">
                  ₹{(totalBalance / 1000).toFixed(0)}K
                </p>
              </div>
            </div>

            {/* Live Authoritative Transaction Badge */}
            {authoritativeTx && authoritativeTx.activeBookingsCount > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <span>Verified Bookings Value:</span>
                <span className="font-bold text-gray-900">
                  ₹{authoritativeTx.totalBookedValue.toLocaleString()} ({authoritativeTx.activeBookingsCount} active)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="px-4 space-y-4">
        <h3 className="font-bold text-lg mb-2" style={{ color: theme.semantic.text.primary }}>
          Expense Categories
        </h3>

        {budgetData.categories?.map((category) => {
          const isEditing = editingCategory === category.name;
          const currentFinancials = tempFinancials[category.name] || {};
          const advancePaid = currentFinancials.advancePaid !== undefined ? currentFinancials.advancePaid : category.advancePaid;
          const balanceAmount = currentFinancials.balanceAmount !== undefined ? currentFinancials.balanceAmount : category.balanceAmount;

          return (
            <div
              key={category.id || category.name}
              className="bg-white rounded-xl p-4 shadow-sm border border-black/5 transition-all"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color || '#ec4899' }}
                  />
                  <div>
                    <h4 className="font-bold text-base" style={{ color: theme.semantic.text.primary }}>
                      {category.name}
                    </h4>
                    <span className="text-xs text-gray-500">{category.status}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleVendorNavigation(category.name)}
                    className="p-1.5 rounded-lg text-xs font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    Find Vendors
                  </button>
                  <button
                    onClick={() => (isEditing ? cancelEditing() : startEditingCategory(category))}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Icon name={isEditing ? 'close' : 'edit'} size="sm" />
                  </button>
                </div>
              </div>

              {/* Editing Form */}
              {isEditing ? (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Advance Paid</label>
                      <input
                        type="number"
                        min="0"
                        value={advancePaid}
                        onChange={(e) => updateCategoryFinancials(category.name, 'advancePaid', e.target.value)}
                        className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Balance Amount</label>
                      <input
                        type="number"
                        min="0"
                        value={balanceAmount}
                        onChange={(e) => updateCategoryFinancials(category.name, 'balanceAmount', e.target.value)}
                        className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveCategoryFinancials(category.name)}
                      disabled={isSaving}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-primary-600 rounded-lg shadow hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Static Category Display */
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                    <span>Spent: {formatCurrency(category.spent || category.advancePaid)}</span>
                    <span className="font-semibold">{formatCurrency(category.totalAmount)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, getPercentage(category.spent || category.advancePaid, category.totalAmount))}%`,
                        backgroundColor: category.color || '#ec4899'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                    <span>Balance: {formatCurrency(category.balanceAmount)}</span>
                    <span>{getPercentage(category.spent || category.advancePaid, category.totalAmount)}% used</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetPlanner;