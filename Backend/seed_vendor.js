const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const Vendor = require('./modules/vendor/Vendor');
const User = require('./modules/user/user.model');
const Lead = require('./modules/vendor/Lead');
const Booking = require('./modules/vendor/Booking');
const Review = require('./modules/vendor/Review');

const seedData = async () => {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/utsavo-chakra');
        console.log('✅ Connected to MongoDB');

        // 1. Create a Test User (Customer)
        const testUserEmail = 'customer@utsavo.com';
        const testUserPhone = '9876543210';
        let user = await User.findOne({ $or: [{ email: testUserEmail }, { phone: testUserPhone }] });
        if (!user) {
            console.log('👤 Creating Test User...');
            user = await User.create({
                name: 'John Doe',
                email: testUserEmail,
                phone: testUserPhone,
                password: 'password123',
                city: 'Indore',
                isPhoneVerified: true,
                isEmailVerified: true
            });
        }

        // 2. Create a Vendor
        const vendorEmail = 'vendor@utsavo.com';
        const vendorPhone = '8888888888';

        // Clear existing data for this vendor to avoid duplicates
        const existingVendor = await Vendor.findOne({ $or: [{ email: vendorEmail }, { phone: vendorPhone }] });
        if (existingVendor) {
            console.log('🗑️ Cleaning up existing data for this vendor...');
            await Lead.deleteMany({ vendorId: existingVendor._id });
            await Booking.deleteMany({ vendorId: existingVendor._id });
            await Review.deleteMany({ vendorId: existingVendor._id });
            await Vendor.deleteOne({ _id: existingVendor._id });
        }

        console.log('🏪 Creating Test Vendor...');
        const vendor = await Vendor.create({
            fullName: 'Rahul Sharma',
            businessName: 'Rahul Photography',
            email: vendorEmail,
            phone: vendorPhone,
            city: 'Indore',
            category: 'Photographer',
            password: 'password123',
            isVerified: true,
            onboardingStep: 'completed',
            businessDetails: {
                description: 'Elite wedding photography services with over 5 years of experience.',
                years: '5+',
                teamSize: '5',
                languages: ['Hindi', 'English'],
                serviceCities: ['Indore', 'Bhopal', 'Ujjain']
            },
            subscription: {
                planId: 'plan_premium',
                planName: 'Premium Plan',
                amount: 2999,
                status: 'Active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }
        });

        console.log('📈 Seeding Leads...');
        const leads = await Lead.insertMany([
            {
                vendorId: vendor._id,
                userId: user._id,
                customerName: 'Amit Verma',
                phone: '9123456789',
                eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                eventLocation: 'Indore',
                message: 'I want to book you for my engagement ceremony.',
                status: 'New'
            },
            {
                vendorId: vendor._id,
                userId: user._id,
                customerName: 'Priya Singh',
                phone: '9888877777',
                eventDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                eventLocation: 'Bhopal',
                message: 'Looking for a full wedding photography package.',
                status: 'Contacted'
            }
        ]);

        console.log('📅 Seeding Bookings...');
        await Booking.insertMany([
            {
                vendorId: vendor._id,
                userId: user._id,
                leadId: leads[0]._id,
                eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                location: 'Sayaji Hotel, Indore',
                services: ['Photography', 'Cinematography'],
                totalPrice: 55000,
                status: 'Confirmed'
            }
        ]);

        console.log('⭐ Seeding Reviews...');
        await Review.insertMany([
            {
                vendorId: vendor._id,
                userId: user._id,
                rating: 5,
                comment: 'Amazing photography! Rahul is very professional.',
                tags: ['Punctual', 'Professional']
            }
        ]);

        console.log('\n✨ Database Seeded Successfully!');
        console.log('-----------------------------------');
        console.log('VENDOR LOGIN CREDENTIALS:');
        console.log(`Email:    ${vendorEmail}`);
        console.log(`Phone:    ${vendorPhone}`);
        console.log(`Password: password123`);
        console.log('-----------------------------------');
        console.log('CUSTOMER LOGIN CREDENTIALS:');
        console.log(`Email:    ${testUserEmail}`);
        console.log(`Password: password123`);
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
