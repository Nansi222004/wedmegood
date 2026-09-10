const mongoose = require('mongoose');
const Category = require('./modules/admin/Category');
const SubCategory = require('./modules/admin/SubCategory');
require('dotenv').config();

const allCategories = [
  {
    name: "Venues",
    description: "Banquets, Farmhouses, and Hotels",
    order: 1,
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Banquet Halls", description: "Indoor AC halls for functions" },
      { name: "Lawn / Farmhouse", description: "Outdoor open spaces" },
      { name: "Luxury Hotels", description: "Premium 5-star wedding venues" },
      { name: "Resorts", description: "Destination wedding locations" },
      { name: "Heritage / Palace Venues", description: "Royal palaces and heritage forts" }
    ]
  },
  {
    name: "Photographers",
    description: "Wedding photography and videography",
    order: 2,
    image: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Candid Photographer", description: "Unposed and natural wedding shots" },
      { name: "Traditional Photographer", description: "Classic posed family photography" },
      { name: "Cinematographer", description: "High quality wedding films" },
      { name: "Pre-Wedding Shoot", description: "Location-based couple shoots" },
      { name: "Drone Photography", description: "Aerial shots and cinematic perspectives" }
    ]
  },
  {
    name: "Catering",
    description: "Food and catering services for events",
    order: 3,
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Vegetarian Catering", description: "Pure veg wedding food services" },
      { name: "Multi Cuisine", description: "Indian, Chinese, Continental dishes" },
      { name: "Dessert Stations", description: "Live counters for sweets and cakes" },
      { name: "Live Counters", description: "Chaat, pasta and live grill stalls" },
      { name: "Beverages & Mocktails", description: "Cocktails, smoothies and drinks bar" }
    ]
  },
  {
    name: "Makeup Artists",
    description: "Bridal makeup and hair styling",
    order: 4,
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Bridal Makeup", description: "Traditional bridal looks" },
      { name: "Airbrush Makeup", description: "Flawless HD airbrush makeup" },
      { name: "Hair Stylist", description: "Bridal hair extensions and styling" },
      { name: "Pre-Wedding Glam", description: "Looks for engagement and sangeet" },
      { name: "Family / Party Makeup", description: "Styling for bridesmaids and relatives" }
    ]
  },
  {
    name: "Decorators",
    description: "Event decor and floral arrangements",
    order: 5,
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
    isActive: true,
    subCategories: [
      { name: "Floral Decor", description: "Mandap and stage flower setups" },
      { name: "Thematic Decor", description: "Custom theme-based decorations" },
      { name: "Light & Sound", description: "Fairy lights, LEDs, and audio setups" },
      { name: "Mandap Decor", description: "Traditional and modern wedding mandaps" },
      { name: "Entrance & Stage", description: "Grand walkways and backdrop decor" }
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
      { name: "Destination Planners", description: "Outstation wedding management" },
      { name: "Day-of Coordination", description: "Vendor management on wedding day" }
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
      { name: "Cocktail Gowns", description: "Indo-western reception gowns" },
      { name: "Anarkalis & Suits", description: "Mehendi and Haldi outfits" }
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
      { name: "Kurta Pyjama", description: "Haldi and Mehendi outfits" },
      { name: "Indo-Western", description: "Modern fusion wear for grooms" }
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
      { name: "Family Mehendi", description: "Bulk guest mehendi application" },
      { name: "Rajasthani / Marwari Mehendi", description: "Traditional figures and portraits" }
    ]
  },
  {
    name: "Jewellery",
    description: "Wedding jewellery and accessories",
    order: 10,
    isActive: true,
    subCategories: [
      { name: "Bridal Jewellery Sets", description: "Polki, Kundan and Gold sets" },
      { name: "Diamond Jewellery", description: "Rings, necklaces and bangles" },
      { name: "Rental Jewellery", description: "Affordable imitation & bridal sets" },
      { name: "Floral & Gota Jewellery", description: "Handmade jewellery for Haldi & Mehendi" }
    ]
  },
  {
    name: "Wedding Invitations",
    description: "Digital and printed wedding invitations",
    order: 11,
    isActive: true,
    subCategories: [
      { name: "Digital Invites & Videos", description: "E-invites, Save-the-date animations" },
      { name: "Traditional Box Cards", description: "Luxury printed wedding cards" },
      { name: "Caricature & Comic Cards", description: "Fun story-based invitations" }
    ]
  },
  {
    name: "Choreographers",
    description: "Sangeet and wedding dance choreography",
    order: 12,
    isActive: true,
    subCategories: [
      { name: "Sangeet Choreographer", description: "Couple and family dance training" },
      { name: "Grand Entry Choreography", description: "Bespoke bridal/groom entries" },
      { name: "Flash Mob Choreography", description: "Surprise dance performances" }
    ]
  },
  {
    name: "Music & DJs",
    description: "Wedding DJs, live bands and sound systems",
    order: 13,
    isActive: true,
    subCategories: [
      { name: "Wedding DJ", description: "Professional DJs and sound setups" },
      { name: "Live Band / Singers", description: "Acoustic, Sufi, and Bollywood performers" },
      { name: "Dhol & Brass Band", description: "Baraat dhol and brass bands" },
      { name: "Shehnai & Traditional Music", description: "Traditional auspicious welcome music" }
    ]
  }
];

const seedNewCategories = async () => {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/utsavo-chakra');
        console.log('✅ Connected to DB');

        // Clear existing categories and subcategories to prevent orphans/duplicates
        await Category.deleteMany({});
        await SubCategory.deleteMany({});
        console.log('🧹 Cleared old Category and SubCategory collections');

        for (const catData of allCategories) {
            const { subCategories, ...categoryFields } = catData;
            const category = new Category(categoryFields);
            await category.save();

            let subCount = 0;
            if (subCategories && subCategories.length > 0) {
                for (const sub of subCategories) {
                    await SubCategory.create({
                        categoryId: category._id,
                        name: sub.name,
                        status: true
                    });
                    subCount++;
                }
            }
            console.log(`✅ Seeded: ${category.name} with ${subCount} subcategories`);
        }
        
        console.log(`\n🎉 All 13 categories and their subcategories seeded successfully!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding categories:', err);
        process.exit(1);
    }
};

seedNewCategories();
