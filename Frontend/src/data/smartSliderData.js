// Smart Slider Data for Home Page
import { vendors } from './vendors.js';

// Helper function to get vendors by category with limit
const getVendorsByCategory = (category, limit = 10) => {
  return vendors.filter(vendor => vendor.category === category).slice(0, limit);
};

// Helper function to get trending vendors
const getTrendingVendors = (limit = 10) => {
  return vendors.filter(vendor => vendor.isTrending).slice(0, limit);
};

// Helper function to get vendors by rating
const getTopRatedVendors = (minRating = 4.5, limit = 10) => {
  return vendors.filter(vendor => vendor.rating >= minRating).slice(0, limit);
};

// Helper function to format vendor data for slider
const formatVendorForSlider = (vendor, customCategory = null, customTag = null) => ({
  id: vendor.id,
  name: vendor.name,
  category: customCategory || vendor.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
  location: vendor.location,
  price: vendor.price,
  rating: vendor.rating,
  image: vendor.image,
  tag: customTag,
  whatsappNumber: vendor.phone
});

export const smartSliderCategories = {
  trending: {
    title: "Trending Vendors Near You",
    items: getTrendingVendors(10).map(vendor => formatVendorForSlider(vendor, null, "Trending"))
  },

  budget: {
    title: "Budget Friendly Picks",
    items: [
      ...getVendorsByCategory('makeup', 3).map(vendor => formatVendorForSlider(vendor, "Bridal Makeup", "Budget Pick")),
      ...getVendorsByCategory('mehndi', 3).map(vendor => formatVendorForSlider(vendor, "Mehndi Artists", "Budget Pick")),
      ...getVendorsByCategory('invites-gifts', 2).map(vendor => formatVendorForSlider(vendor, "Invitations & Gifts", "Budget Pick")),
      ...getVendorsByCategory('pandits', 2).map(vendor => formatVendorForSlider(vendor, "Wedding Pandits", "Budget Pick"))
    ]
  },

  luxury: {
    title: "Luxury Wedding Specialists",
    items: [
      ...getVendorsByCategory('venues', 3).map(vendor => formatVendorForSlider(vendor, "Wedding Venues", "Luxury")),
      ...getVendorsByCategory('photographers', 2).map(vendor => formatVendorForSlider(vendor, "Wedding Photography", "Luxury")),
      ...getVendorsByCategory('jewellery', 2).map(vendor => formatVendorForSlider(vendor, "Luxury Jewellery", "Luxury")),
      ...getVendorsByCategory('bridal-wear', 2).map(vendor => formatVendorForSlider(vendor, "Bridal Wear", "Luxury")),
      ...getVendorsByCategory('planning-decor', 1).map(vendor => formatVendorForSlider(vendor, "Wedding Planning", "Luxury"))
    ]
  },

  topRated: {
    title: "Top Rated Vendors (4.5+)",
    items: getTopRatedVendors(4.5, 10).map(vendor => formatVendorForSlider(vendor))
  },

  valueForMoney: {
    title: "Value for Money Deals",
    items: [
      ...getVendorsByCategory('photographers', 2).map(vendor => formatVendorForSlider(vendor, "Wedding Photography")),
      ...getVendorsByCategory('makeup', 2).map(vendor => formatVendorForSlider(vendor, "Bridal Makeup")),
      ...getVendorsByCategory('mehndi', 2).map(vendor => formatVendorForSlider(vendor, "Mehndi Artists")),
      ...getVendorsByCategory('music-dance', 2).map(vendor => formatVendorForSlider(vendor, "Music & Entertainment")),
      ...getVendorsByCategory('food', 2).map(vendor => formatVendorForSlider(vendor, "Catering Services"))
    ]
  },

  mostBooked: {
    title: "Most Booked This Month",
    items: getTrendingVendors(10).map(vendor => formatVendorForSlider(vendor, null, "Best Seller"))
  },

  newVendors: {
    title: "Newly Added Vendors",
    items: [
      ...getVendorsByCategory('virtual-planning', 3).map(vendor => formatVendorForSlider(vendor, "Virtual Planning")),
      ...getVendorsByCategory('pre-wedding-shoot', 3).map(vendor => formatVendorForSlider(vendor, "Pre-Wedding Photography")),
      ...getVendorsByCategory('groom-wear', 2).map(vendor => formatVendorForSlider(vendor, "Groom Wear")),
      ...getVendorsByCategory('jewellery', 2).map(vendor => formatVendorForSlider(vendor, "Wedding Jewellery"))
    ]
  },

  preWeddingShoot: {
    title: "Best for Pre-Wedding Shoots",
    items: [
      ...getVendorsByCategory('pre-wedding-shoot', 5).map(vendor => formatVendorForSlider(vendor, "Pre-Wedding Photography")),
      ...getVendorsByCategory('photographers', 3).map(vendor => formatVendorForSlider(vendor, "Wedding Photography")),
      ...getVendorsByCategory('makeup', 2).map(vendor => formatVendorForSlider(vendor, "Makeup & Styling"))
    ]
  },

  sangeetEntertainment: {
    title: "Best for Sangeet & Entertainment",
    items: [
      ...getVendorsByCategory('music-dance', 4).map(vendor => formatVendorForSlider(vendor, "Music & Entertainment")),
      ...getVendorsByCategory('venues', 3).map(vendor => formatVendorForSlider(vendor, "Sangeet Venues")),
      ...getVendorsByCategory('planning-decor', 2).map(vendor => formatVendorForSlider(vendor, "Event Decoration")),
      ...getVendorsByCategory('food', 1).map(vendor => formatVendorForSlider(vendor, "Event Catering"))
    ]
  },

  bridalFavorites: {
    title: "Bridal Favorites",
    items: [
      ...getVendorsByCategory('makeup', 3).map(vendor => formatVendorForSlider(vendor, "Bridal Makeup")),
      ...getVendorsByCategory('mehndi', 3).map(vendor => formatVendorForSlider(vendor, "Bridal Mehndi")),
      ...getVendorsByCategory('bridal-wear', 2).map(vendor => formatVendorForSlider(vendor, "Bridal Wear")),
      ...getVendorsByCategory('jewellery', 2).map(vendor => formatVendorForSlider(vendor, "Bridal Jewellery"))
    ]
  },

  editorsChoice: {
    title: "Editor's Choice",
    items: [
      ...getVendorsByCategory('photographers', 3).map(vendor => formatVendorForSlider(vendor, "Wedding Photography")),
      ...getVendorsByCategory('venues', 2).map(vendor => formatVendorForSlider(vendor, "Wedding Venues")),
      ...getVendorsByCategory('planning-decor', 2).map(vendor => formatVendorForSlider(vendor, "Wedding Planning")),
      ...getVendorsByCategory('food', 2).map(vendor => formatVendorForSlider(vendor, "Premium Catering")),
      ...getVendorsByCategory('makeup', 1).map(vendor => formatVendorForSlider(vendor, "Bridal Makeup"))
    ]
  },

  nearLocation: {
    title: "Near Your Location (Indore)",
    items: vendors.filter(vendor => vendor.location.includes('Indore')).slice(0, 10).map(vendor => 
      formatVendorForSlider({
        ...vendor,
        location: `${vendor.location} - ${Math.floor(Math.random() * 4) + 1}km`
      })
    )
  }
};