const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const Vendor = require('./modules/vendor/Vendor');
const User = require('./modules/user/user.model');
const Lead = require('./modules/vendor/Lead');
const Booking = require('./modules/vendor/Booking');
const Review = require('./modules/vendor/Review');
const Category = require('./modules/admin/Category');
const Service = require('./modules/vendor/Service');

const seedData = async () => {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/utsavo-chakra');
        console.log('✅ Connected to MongoDB');

        // 0. Ensure Photographers Category exists
        let photoCategory = await Category.findOne({ $or: [{ slug: 'photographers' }, { name: /photographer/i }] });
        if (!photoCategory) {
            photoCategory = await Category.create({
                name: 'Photographers',
                slug: 'photographers',
                description: 'Capture your precious wedding moments forever',
                icon: 'camera'
            });
            console.log('📷 Created Photographers Category');
        }

        // 1. Create / Update Test User (Customer)
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

        // 2. Clean up existing test vendor data
        const vendorEmails = ['vendor@utsavo.com', 'bhopal.photo@utsavo.com'];
        const existingVendors = await Vendor.find({ email: { $in: vendorEmails } });
        const existingIds = existingVendors.map(v => v._id);

        if (existingIds.length > 0) {
            console.log('🗑️ Cleaning up existing test vendors and linked records...');
            await Lead.deleteMany({ vendorId: { $in: existingIds } });
            await Booking.deleteMany({ vendorId: { $in: existingIds } });
            await Review.deleteMany({ vendorId: { $in: existingIds } });
            await Service.deleteMany({ vendor: { $in: existingIds } });
            await Vendor.deleteMany({ _id: { $in: existingIds } });
        }

        // 3. Create Rahul Photography (Approved, active in Indore, Bhopal, all)
        console.log('🏪 Creating Rahul Photography (Indore & Bhopal)...');
        const rahulVendor = await Vendor.create({
            fullName: 'Rahul Sharma',
            businessName: 'Rahul Photography',
            email: 'vendor@utsavo.com',
            phone: '8888888888',
            city: 'Indore',
            serviceCities: ['Indore', 'Bhopal', 'Ujjain', 'all'],
            selectedCategories: [{
                categoryId: photoCategory._id,
                categoryName: photoCategory.name
            }],
            category: 'Photographers',
            password: 'password123',
            status: 'Approved',
            isVerified: true,
            isActive: true,
            isFeatured: true,
            isServiceProfileCompleted: true,
            onboardingStep: 'completed',
            rating: 4.9,
            reviewCount: 18,
            startingPrice: 35000,
            profileImage: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=500&auto=format&fit=crop&q=80',
            businessDetails: {
                description: 'Award-winning wedding photography & cinematic 4K film. Capturing weddings across Indore, Bhopal, and Central India with candid storytelling.',
                years: '5+',
                teamSize: '6',
                languages: ['Hindi', 'English'],
                serviceCities: ['Indore', 'Bhopal', 'Ujjain', 'all']
            },
            portfolio: [
                { title: 'Royal Wedding Sangeet', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800', type: 'Photo' },
                { title: 'Bridal Elegance', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800', type: 'Photo' },
                { title: 'Pheras & Sunset', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800', type: 'Photo' }
            ],
            services: [{
                name: 'Candid & Cinematic Wedding Photography',
                category: 'Photographers',
                price: 35000,
                features: ['Pre-wedding shoot', 'Full HD cinematic teaser', 'Leatherette album with 300 photos'],
                packages: [
                    { name: 'Standard Package', price: 35000, features: ['1 Day Photography', 'Online Cloud Gallery'] },
                    { name: 'Premium 4K Package', price: 65000, features: ['2 Days Photography + Cinematography', 'Drone Aerial Shots', '2 Designer Albums'] }
                ]
            }],
            pricing: {
                range: '₹35,000 - ₹85,000',
                notes: 'All packages include color-graded digital gallery and high-resolution deliverables.'
            },
            subscription: {
                planId: 'plan_premium',
                planName: 'Premium Partner Plan',
                amount: 2999,
                status: 'Active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }
        });

        // Seed Canonical Service for Rahul
        await Service.create({
            vendor: rahulVendor._id,
            category: photoCategory._id,
            name: 'Candid & Cinematic Wedding Photography',
            shortDescription: 'Capturing unforgettable wedding stories in 4K resolution with drone cinematography.',
            detailedDescription: 'Full coverage of engagement, sangeet, and wedding ceremonies with candid storytelling, cinematic editing, and luxury printed albums.',
            coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
            gallery: [
                { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800', type: 'image' },
                { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800', type: 'image' }
            ],
            price: { original: 45000, discounted: 35000, currency: 'INR' },
            features: ['Candid Photography', 'Traditional Photography', 'Cinematic Teaser', 'Drone Shots', 'Printed Album'],
            isActive: true
        });

        // 4. Create Bhopal Royal Studios (Dedicated Bhopal listing)
        console.log('🏪 Creating Bhopal Royal Studios...');
        const bhopalVendor = await Vendor.create({
            fullName: 'Vikram Singh',
            businessName: 'Bhopal Royal Studios',
            email: 'bhopal.photo@utsavo.com',
            phone: '8777777777',
            city: 'Bhopal',
            serviceCities: ['Bhopal', 'Indore', 'all'],
            selectedCategories: [{
                categoryId: photoCategory._id,
                categoryName: photoCategory.name
            }],
            category: 'Photographers',
            password: 'password123',
            status: 'Approved',
            isVerified: true,
            isActive: true,
            isFeatured: false,
            isServiceProfileCompleted: true,
            onboardingStep: 'completed',
            rating: 4.8,
            reviewCount: 14,
            startingPrice: 28000,
            profileImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80',
            businessDetails: {
                description: 'Specialists in destination and traditional weddings across Bhopal and surrounding heritage venues.',
                years: '4+',
                teamSize: '4',
                languages: ['Hindi', 'English'],
                serviceCities: ['Bhopal', 'Indore', 'all']
            },
            portfolio: [
                { title: 'Lake View Wedding', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800', type: 'Photo' }
            ],
            services: [{
                name: 'Traditional & Modern Wedding Photography',
                category: 'Photographers',
                price: 28000,
                features: ['Full ceremony coverage', 'Digital album', 'Short cinematic highlight']
            }],
            pricing: {
                range: '₹28,000 - ₹55,000'
            },
            subscription: {
                planId: 'plan_pro',
                planName: 'Pro Plan',
                amount: 1999,
                status: 'Active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }
        });

        await Service.create({
            vendor: bhopalVendor._id,
            category: photoCategory._id,
            name: 'Traditional & Modern Wedding Photography',
            shortDescription: 'Heritage wedding coverage across Bhopal with modern candid aesthetics.',
            detailedDescription: 'Specializing in lakefront and heritage venue weddings with modern aesthetics and warm color grading.',
            coverImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
            gallery: [
                { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800', type: 'image' }
            ],
            price: { original: 35000, discounted: 28000, currency: 'INR' },
            features: ['Full ceremony coverage', 'Digital album', 'Short cinematic highlight'],
            isActive: true
        });

        // 5. Seed sample inquiry lead, booking, and reviews
        console.log('📈 Seeding Leads & Bookings...');
        const leads = await Lead.insertMany([
            {
                vendorId: rahulVendor._id,
                userId: user._id,
                customerName: 'Amit Verma',
                phone: '9123456789',
                eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                eventLocation: 'Sayaji Hotel, Indore',
                category: 'Photographers',
                message: 'I want to book you for my wedding & engagement ceremonies.',
                status: 'New'
            }
        ]);

        await Booking.insertMany([
            {
                vendorId: rahulVendor._id,
                userId: user._id,
                leadId: leads[0]._id,
                eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                location: 'Sayaji Hotel, Indore',
                services: ['Candid & Cinematic Wedding Photography'],
                totalPrice: 55000,
                status: 'Confirmed'
            }
        ]);

        await Review.insertMany([
            {
                vendorId: rahulVendor._id,
                userId: user._id,
                rating: 5,
                comment: 'Amazing photography! Rahul and team are extremely professional, punctual, and delivered stunning photos.',
                tags: ['Punctual', 'Creative', 'Professional']
            }
        ]);

        console.log('\n✨ Database Seeded Successfully with Approved Marketplace Vendors!');
        console.log('-----------------------------------');
        console.log('VENDOR 1 (Rahul Photography):');
        console.log(`Email:       vendor@utsavo.com`);
        console.log(`Password:    password123`);
        console.log(`Cities:      Indore, Bhopal, all`);
        console.log(`Category:    Photographers`);
        console.log(`Status:      Approved`);
        console.log('-----------------------------------');
        console.log('VENDOR 2 (Bhopal Royal Studios):');
        console.log(`Email:       bhopal.photo@utsavo.com`);
        console.log(`Password:    password123`);
        console.log(`Cities:      Bhopal, Indore, all`);
        console.log(`Category:    Photographers`);
        console.log(`Status:      Approved`);
        console.log('-----------------------------------');
        console.log('CUSTOMER (John Doe):');
        console.log(`Email:       customer@utsavo.com`);
        console.log(`Password:    password123`);
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
