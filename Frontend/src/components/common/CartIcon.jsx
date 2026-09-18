import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../hooks/useTheme';
import Icon from '../ui/Icon';

const CartIcon = ({ className = '', size = 'md' }) => {
  const { cartState } = useCart();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleCartClick = () => {
    navigate('/user/cart');
  };

  const totalItems = cartState?.totalItems || 0;
  const iconColor = totalItems > 0 
    ? (theme?.colors?.primary?.[600] || '#BE185D') 
    : (theme?.semantic?.navigation?.text || theme?.semantic?.text?.secondary || '#4b5563');

  return (
    <button
      onClick={handleCartClick}
      className={`relative p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${className}`}
      style={{
        color: iconColor,
        backgroundColor: 'transparent'
      }}
      title="Shopping Cart"
      aria-label={`Cart with ${totalItems} items`}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = theme?.semantic?.text?.primary || '#111827';
        e.currentTarget.style.backgroundColor = theme?.semantic?.background?.accent || 'rgba(0,0,0,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = iconColor;
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <Icon
        name="cart"
        size={size}
        style={{ color: iconColor }}
      />

      {/* Cart Badge */}
      {totalItems > 0 && (
        <div
          className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-sm"
          style={{
            backgroundColor: theme?.colors?.primary?.[500] || '#BE185D',
          }}
        >
          <span className="text-[10px] font-bold text-white leading-none">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        </div>
      )}
    </button>
  );
};

export default CartIcon;