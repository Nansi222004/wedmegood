import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';

const CartContext = createContext();

// Cart actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART',
  FINALIZE_ITEM: 'FINALIZE_ITEM',
  UNFINALIZE_ITEM: 'UNFINALIZE_ITEM',
  CLEAR_FINALIZED: 'CLEAR_FINALIZED'
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        // If item exists, update quantity
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          totalItems: state.totalItems + 1
        };
      } else {
        // Add new item
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }],
          totalItems: state.totalItems + 1
        };
      }
    }
    
    case CART_ACTIONS.REMOVE_ITEM: {
      const itemToRemove = state.items.find(item => item.id === action.payload);
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        totalItems: state.totalItems - (itemToRemove?.quantity || 0)
      };
    }
    
    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { id, quantity } = action.payload;
      const currentItem = state.items.find(item => item.id === id);
      const quantityDiff = quantity - (currentItem?.quantity || 0);
      
      if (quantity <= 0) {
        return cartReducer(state, { type: CART_ACTIONS.REMOVE_ITEM, payload: id });
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, quantity } : item
        ),
        totalItems: state.totalItems + quantityDiff
      };
    }
    
    case CART_ACTIONS.FINALIZE_ITEM: {
      const itemToFinalize = state.items.find(item => item.id === action.payload);
      if (!itemToFinalize) return state;
      
      // Ensure finalizedItems exists
      const finalizedItems = state.finalizedItems || [];
      
      // Check if already finalized
      const alreadyFinalized = finalizedItems.find(item => item.id === action.payload);
      if (alreadyFinalized) return state;
      
      return {
        ...state,
        finalizedItems: [...finalizedItems, { ...itemToFinalize, finalizedAt: new Date().toISOString() }]
      };
    }
    
    case CART_ACTIONS.UNFINALIZE_ITEM: {
      return {
        ...state,
        finalizedItems: (state.finalizedItems || []).filter(item => item.id !== action.payload)
      };
    }
    
    case CART_ACTIONS.CLEAR_FINALIZED: {
      return {
        ...state,
        finalizedItems: []
      };
    }
    
    case CART_ACTIONS.CLEAR_CART:
      return {
        items: [],
        totalItems: 0,
        finalizedItems: state.finalizedItems // Keep finalized items
      };
    
    case CART_ACTIONS.LOAD_CART:
      return {
        ...action.payload,
        finalizedItems: action.payload.finalizedItems || []
      };
    
    default:
      return state;
  }
};

// Initial cart state
const initialCartState = {
  items: [],
  totalItems: 0,
  finalizedItems: []
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [cartState, dispatch] = useReducer(cartReducer, initialCartState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('weddingPlannerCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever cart changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('weddingPlannerCart', JSON.stringify(cartState));
    }, 100); // Debounce to prevent excessive localStorage writes

    return () => clearTimeout(timeoutId);
  }, [cartState]);

  // Cart actions - memoized to prevent unnecessary re-renders
  const addToCart = useCallback((vendor) => {
    const cartItem = {
      id: vendor.id,
      name: vendor.name,
      category: vendor.category,
      price: vendor.price,
      image: vendor.image,
      rating: vendor.rating,
      location: vendor.location,
      whatsappNumber: vendor.whatsappNumber || '+919876543210', // Default number
      tag: vendor.tag
    };
    
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: cartItem });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: itemId });
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { id: itemId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  }, []);

  const finalizeItem = useCallback((itemId) => {
    dispatch({ type: CART_ACTIONS.FINALIZE_ITEM, payload: itemId });
  }, []);

  const unfinalizeItem = useCallback((itemId) => {
    dispatch({ type: CART_ACTIONS.UNFINALIZE_ITEM, payload: itemId });
  }, []);

  const clearFinalized = useCallback(() => {
    dispatch({ type: CART_ACTIONS.CLEAR_FINALIZED });
  }, []);

  const isInCart = useCallback((itemId) => {
    return cartState.items.some(item => item.id === itemId);
  }, [cartState.items]);

  const isFinalized = useCallback((itemId) => {
    return cartState.finalizedItems?.some(item => item.id === itemId) || false;
  }, [cartState.finalizedItems]);

  const getItemQuantity = useCallback((itemId) => {
    const item = cartState.items.find(item => item.id === itemId);
    return item?.quantity || 0;
  }, [cartState.items]);

  const getTotalPrice = useCallback(() => {
    return cartState.items.reduce((total, item) => {
      // Extract numeric value from price string (e.g., "₹25,000 per day" -> 25000)
      const priceMatch = item.price.match(/₹([\d,]+)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
      return total + (price * item.quantity);
    }, 0);
  }, [cartState.items]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    cartState,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    finalizeItem,
    unfinalizeItem,
    clearFinalized,
    isInCart,
    isFinalized,
    getItemQuantity,
    getTotalPrice
  }), [
    cartState.items.length, 
    cartState.totalItems,
    cartState.finalizedItems?.length || 0,
    // Only include the actual functions, not their dependencies
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    finalizeItem,
    unfinalizeItem,
    clearFinalized,
    isInCart,
    isFinalized,
    getItemQuantity, 
    getTotalPrice
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;