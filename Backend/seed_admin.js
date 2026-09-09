const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./modules/user/user.model');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/utsavo-chakra');
        console.log('✅ MongoDB Connected');

        const adminEmail = 'a@gmail.com';
        const adminPass = '1234';

        // Delete existing admin if exists
        await User.findOneAndDelete({ email: adminEmail });

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(adminPass, salt);

        const admin = new User({
            name: 'Admin',
            email: adminEmail,
            phone: '9999999999',
            password: adminPass, // Password will be hashed by pre-save middleware in model
            city: 'Admin City',
            role: 'admin',
            isEmailVerified: true,
            isPhoneVerified: true
        });

        await admin.save();
        console.log('✅ Admin user created successfully');
        console.log('Email: a@gmail.com');
        console.log('Password: 1234');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
