import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { useTheme } from '../../../hooks/useTheme';
import { useNavigate } from 'react-router-dom';

const VendorCard = ({ vendor, layout = 'vertical' }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleWhatsAppContact = () => {
    // Format phone number and message for WhatsApp
    const phoneNumber = vendor.phone || '919876543210'; // Default number if not provided
    const message = `Hi! I'm interested in your ${vendor.services.join(', ')} services for my wedding. Can you please share more details?`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleViewDetails = () => {
    navigate(`/user/vendor/${vendor.id}`);
  };

  // Responsive layout for vendor listings
  if (layout === 'responsive') {
    return (
      <Card 
        className="transition-all duration-200 hover:shadow-lg card-hover cursor-pointer"
        style={{
          backgroundColor: theme.semantic.card.background,
          borderColor: theme.semantic.card.border,
          boxShadow: `0 2px 8px -2px ${theme.semantic.card.shadow}`
        }}
        onClick={handleViewDetails}
      >
        <div className="p-4">
          {/* Image */}
          <div className="w-full h-48 sm:h-40 rounded-xl overflow-hidden mb-4">
            <img
              src={vendor.image}
              alt={vendor.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80';
              }}
            />
          </div>
          
          {/* Content */}
          <div className="space-y-3">
            <div>
              <h3 
                className="font-bold text-lg flex items-center gap-2 mb-2 line-clamp-1"
                style={{ color: theme.semantic.text.primary }}
              >
                {vendor.name}
                {vendor.verified && (
                  <Icon name="verified" size="sm" color="accent" />
                )}
              </h3>
              <p 
                className="text-sm mb-2 line-clamp-2"
                style={{ color: theme.semantic.text.secondary }}
              >
                {vendor.description}
              </p>
              <p 
                className="text-sm flex items-center mb-3"
                style={{ color: theme.semantic.text.secondary }}
              >
                <Icon name="location" size="xs" className="mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{vendor.location}</span>
              </p>
            </div>

            {/* Rating and Price Row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div 
                  className="flex items-center px-2 py-1 rounded-full gap-1"
                  style={{ backgroundColor: theme.colors.secondary[100] }}
                >
                  <Icon name="star" size="xs" color="secondary" />
                  <span 
                    className="font-medium text-sm"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    {vendor.rating}
                  </span>
                </div>
                <span 
                  className="text-sm"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  {vendor.reviews} reviews
                </span>
              </div>
              
              <div 
                className="font-bold text-base"
                style={{ color: theme.colors.primary[600] }}
              >
                {vendor.price}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails();
                }}
                className="flex-1"
              >
                View Details
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleWhatsAppContact();
                }}
                className="flex-1 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: '#25D366',
                  borderColor: '#25D366',
                  color: 'white'
                }}
              >
                <Icon name="chat" size="xs" />
                <span className="hidden xs:inline">WhatsApp</span>
                <span className="xs:hidden">Chat</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }
    return (
      <Card 
        className="transition-all duration-200 hover:shadow-lg"
        style={{
          backgroundColor: theme.semantic.card.background,
          borderColor: theme.semantic.card.border,
          boxShadow: `0 2px 8px -2px ${theme.semantic.card.shadow}`
        }}
      >
        <div className="p-4">
          {/* Mobile Layout - Image on top */}
          <div className="block md:hidden">
            <div className="w-full h-48 rounded-xl overflow-hidden mb-4">
              <img
                src={vendor.image}
                alt={vendor.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80';
                }}
              />
            </div>
            
            <div className="space-y-3">
              <div>
                <h3 
                  className="font-bold text-lg flex items-center gap-2 mb-1"
                  style={{ color: theme.semantic.text.primary }}
                >
                  {vendor.name}
                  {vendor.verified && (
                    <Icon name="verified" size="sm" color="accent" />
                  )}
                </h3>
                <p 
                  className="text-sm mb-2"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  {vendor.description}
                </p>
                <p 
                  className="text-sm flex items-center mb-2"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  <Icon name="location" size="xs" className="mr-1" />
                  {vendor.location}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="flex items-center px-2 py-1 rounded-full gap-1"
                    style={{ backgroundColor: theme.colors.secondary[100] }}
                  >
                    <Icon name="star" size="xs" color="secondary" />
                    <span 
                      className="font-medium text-sm"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      {vendor.rating}
                    </span>
                  </div>
                  <span 
                    className="text-sm"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {vendor.reviews} reviews
                  </span>
                </div>
                
                <div 
                  className="font-bold text-base"
                  style={{ color: theme.colors.primary[600] }}
                >
                  {vendor.price}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails();
                  }}
                  className="flex-1"
                >
                  View Details
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWhatsAppContact();
                  }}
                  className="flex-1 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: '#25D366',
                    borderColor: '#25D366',
                    color: 'white'
                  }}
                >
                  <Icon name="chat" size="xs" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Image left, content right */}
          <div className="hidden md:flex md:gap-4">
            <div className="w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={vendor.image}
                alt={vendor.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=256&h=192&fit=crop&q=80';
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-bold text-base flex items-center gap-2 truncate mb-1"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    {vendor.name}
                    {vendor.verified && (
                      <Icon name="verified" size="xs" color="accent" />
                    )}
                  </h3>
                  <p 
                    className="text-sm mb-1"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {vendor.description}
                  </p>
                  <p 
                    className="text-sm flex items-center"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    <Icon name="location" size="xs" className="mr-1" />
                    {vendor.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="flex items-center px-2 py-1 rounded-full gap-1"
                    style={{ backgroundColor: theme.colors.secondary[100] }}
                  >
                    <Icon name="star" size="xs" color="secondary" />
                    <span 
                      className="font-medium text-xs"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      {vendor.rating}
                    </span>
                  </div>
                  <span 
                    className="text-xs"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    ({vendor.reviews})
                  </span>
                  
                  <div 
                    className="font-bold text-sm ml-2"
                    style={{ color: theme.colors.primary[600] }}
                  >
                    {vendor.price}
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWhatsAppContact();
                  }}
                  className="flex items-center gap-1"
                  style={{
                    backgroundColor: '#25D366',
                    borderColor: '#25D366',
                    color: 'white'
                  }}
                >
                  <Icon name="chat" size="xs" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Vertical layout (original - for other uses)
  return (
    <Card 
      className="transition-all duration-200 hover:-translate-y-1 cursor-pointer"
      style={{
        backgroundColor: theme.semantic.card.background,
        borderColor: theme.semantic.card.border,
        boxShadow: `0 4px 6px -1px ${theme.semantic.card.shadow}`
      }}
      hover={true}
      onClick={handleViewDetails}
    >
      <div 
        className="aspect-video rounded-xl mb-4 overflow-hidden"
        style={{ background: theme.semantic.background.gradient.card }}
      >
        <img
          src={vendor.image}
          alt={vendor.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=450&fit=crop&q=80';
          }}
        />
      </div>

      <Card.Content className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 
              className="font-semibold text-lg flex items-center gap-2"
              style={{ color: theme.semantic.text.primary }}
            >
              {vendor.name}
              {vendor.verified && (
                <Icon 
                  name="verified" 
                  size="sm" 
                  color="accent"
                />
              )}
            </h3>
            <p 
              className="text-sm"
              style={{ color: theme.semantic.text.secondary }}
            >
              {vendor.location}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div 
            className="flex items-center px-2 py-1 rounded-full gap-1"
            style={{ backgroundColor: theme.colors.secondary[100] }}
          >
            <Icon name="star" size="xs" color="secondary" />
            <span 
              className="font-medium ml-1 text-sm"
              style={{ color: theme.semantic.text.primary }}
            >
              {vendor.rating}
            </span>
          </div>
          <span style={{ color: theme.semantic.text.tertiary }}>•</span>
          <span 
            className="text-sm"
            style={{ color: theme.semantic.text.secondary }}
          >
            {vendor.reviews} reviews
          </span>
        </div>

        <div 
          className="font-semibold text-lg"
          style={{ color: theme.colors.primary[600] }}
        >
          {vendor.price}
        </div>

        <div className="flex flex-wrap gap-1">
          {vendor.services.map((service) => (
            <span
              key={service}
              className="px-2 py-1 text-xs rounded-full font-medium"
              style={{
                backgroundColor: theme.colors.primary[100],
                color: theme.colors.primary[700]
              }}
            >
              {service}
            </span>
          ))}
        </div>
      </Card.Content>

      <Card.Footer>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className="flex-1"
          >
            View Details
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleWhatsAppContact();
            }}
            className="flex-1 flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#25D366',
              borderColor: '#25D366',
              color: 'white'
            }}
          >
            <Icon name="chat" size="xs" />
            WhatsApp
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default VendorCard;