const mongoose = require('mongoose');
const Category = require('./modules/admin/Category');
require('dotenv').config();

const newCategories = [
  {
    name: "Photographers",
    description: "Wedding photography and videography",
    order: 1,
    image: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Candid Photographer", description: "Unposed and natural wedding shots" },
      { name: "Traditional Photographer", description: "Classic posed family photography" },
      { name: "Cinematographer", description: "High quality wedding films" },
      { name: "Pre-Wedding Shoot", description: "Location-based couple shoots" }
    ]
  },
  {
    name: "Makeup Artists",
    description: "Bridal makeup and hair styling",
    order: 2,
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Bridal Makeup", description: "Traditional bridal looks" },
      { name: "Airbrush Makeup", description: "Flawless HD airbrush makeup" },
      { name: "Hair Stylist", description: "Bridal hair extensions and styling" }
    ]
  },
  {
    name: "Venues",
    description: "Banquets, Farmhouses, and Hotels",
    order: 3,
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Banquet Halls", description: "Indoor AC halls for functions" },
      { name: "Lawn / Farmhouse", description: "Outdoor open spaces" },
      { name: "Luxury Hotels", description: "Premium 5-star wedding venues" },
      { name: "Resorts", description: "Destination wedding locations" }
    ]
  },
  {
    name: "Decorators",
    description: "Event decor and floral arrangements",
    order: 4,
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Floral Decor", description: "Mandap and stage flower setups" },
      { name: "Thematic Decor", description: "Custom theme-based decorations" },
      { name: "Light & Sound", description: "Fairy lights, LEDs, and audio setups" }
    ]
  },
  {
    name: "Caterers",
    description: "Food and catering services for events",
    order: 5,
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Vegetarian Catering", description: "Pure veg wedding food services" },
      { name: "Multi Cuisine", description: "Indian, Chinese, Continental dishes" },
      { name: "Dessert Stations", description: "Live counters for sweets and cakes" }
    ]
  },
  {
    name: "Wedding Planners",
    description: "Full wedding management services",
    order: 6,
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Full Planning", description: "A-Z event coordination" },
      { name: "Partial Planning", description: "Day-of execution and support" },
      { name: "Destination Planners", description: "Outstation wedding management" }
    ]
  },
  {
    name: "Bridal Wear",
    description: "Lehengas, Sarees, and Gowns",
    order: 7,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Bridal Lehengas", description: "Designer lehengas for the wedding day" },
      { name: "Sarees", description: "Silk and designer sarees" },
      { name: "Cocktail Gowns", description: "Indo-western reception gowns" }
    ]
  },
  {
    name: "Groom Wear",
    description: "Sherwanis, Suits, and Tuxedos",
    order: 8,
    image: "https://images.unsplash.com/photo-1593030761757-71fae46af504?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Sherwanis", description: "Traditional wedding sherwanis" },
      { name: "Suits & Tuxedos", description: "Formal reception wear" },
      { name: "Kurta Pyjama", description: "Haldi and Mehendi outfits" }
    ]
  },
  {
    name: "Mehendi Artists",
    description: "Traditional and modern mehendi designs",
    order: 9,
    image: "https://images.unsplash.com/photo-1562015091-6107b1d9bf5c?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Bridal Mehendi", description: "Intricate full hands and legs designs" },
      { name: "Arabic Mehendi", description: "Modern minimal patterns" },
      { name: "Family Mehendi", description: "Bulk guest mehendi application" }
    ]
  },
  {
    name: "Music & Choreography",
    description: "Sangeet training and entertainment",
    order: 10,
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Sangeet Choreographer", description: "Couple and family dance training" },
      { name: "Wedding DJ", description: "Professional DJs and sound setups" },
      { name: "Live Band", description: "Acoustic and Sufi singers" }
    ]
  }
];

const seedNewCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/utsavo-chakra');
        console.log('Connected to DB...');

        // Clear existing just in case there are lingering docs
        await Category.deleteMany();

        for (const catData of newCategories) {
            const category = new Category(catData);
            await category.save();
            console.log(`Successfully added: ${category.name}`);
        }
        
        console.log(`\nAll 10 categories have been added successfully!`);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding new categories:', err);
        process.exit(1);
    }
};

seedNewCategories();
