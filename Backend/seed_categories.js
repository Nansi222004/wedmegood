const mongoose = require('mongoose');
const Category = require('./modules/admin/Category');
require('dotenv').config();

const categories = [
    { name: 'Venues', description: 'Banquets, Farmhouses, and Hotels' },
    { name: 'Photographers', description: 'Wedding photography and videography' },
    { name: 'Catering', description: 'Food and beverage services' },
    { name: 'Makeup Artists', description: 'Bridal makeup and hair styling' },
    { name: 'Decorators', description: 'Event decor and floral arrangements' },
    { name: 'Wedding Planners', description: 'Full wedding management services' },
    { name: 'Bridal Wear', description: 'Lehengas, Sarees, and Gowns' },
    { name: 'Groom Wear', description: 'Sherwanis, Suits, and Tuxedos' },
    { name: 'Mehendi Artists', description: 'Traditional and modern mehendi designs' },
    { name: 'Jewellery', description: 'Wedding sets and accessories' },
    { name: 'Wedding Invitations', description: 'Digital and physical cards' },
    { name: 'Choreographers', description: 'Sangeet and dance training' },
    { name: 'Music & DJs', description: 'Sound systems and entertainment' }
];

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/utsavo-chakra');
        console.log('Connected to database for seeding...');

        // Clear existing categories
        await Category.deleteMany();
        console.log('Cleared existing categories');

        // Insert new categories one by one to trigger pre-save middleware (slug generation)
        for (const catData of categories) {
            const category = new Category(catData);
            await category.save();
            console.log(`Seeded: ${category.name}`);
        }
        console.log(`Successfully seeded ${categories.length} categories!`);

        process.exit();
    } catch (err) {
        console.error('Error seeding categories:', err);
        process.exit(1);
    }
};

seedCategories();
