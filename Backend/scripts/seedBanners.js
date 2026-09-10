const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Banner = require('../modules/admin/Banner');

dotenv.config({ path: path.join(__dirname, '../.env') });

const banners = [
    {
        title: 'Grow Business',
        description: 'Expand your wedding business exponentially',
        imageUrl: 'https://images.unsplash.com/photo-1465495910483-0d75a603645a?w=800',
        placement: 'Hero Main',
        target: 'Vendor',
        status: 'Active'
    },
    {
        title: 'Premium Leads',
        description: 'Connect with verified high-budget couples',
        imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
        placement: 'Hero Main',
        target: 'Vendor',
        status: 'Active'
    },
    {
        title: 'Top Visibility',
        description: 'Get top visibility on the home page',
        imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
        placement: 'Hero Main',
        target: 'Vendor',
        status: 'Active'
    }
];

const seedBanners = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding banners...');

        // Clear existing banners
        await Banner.deleteMany({});
        console.log('Existing banners cleared.');

        for (const banner of banners) {
            await Banner.create(banner);
        }

        console.log('Banners seeded successfully!');
        process.exit();
    } catch (err) {
        console.error('Error seeding banners:', err);
        process.exit(1);
    }
};

seedBanners();
