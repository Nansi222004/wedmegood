const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../modules/user/user.model');

const initializeAdmin = async () => {
    try {
        const adminEmail = 'a@gmail.com';
        const adminPass = '1234';

        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (existingAdmin) {
            console.log('✅ Admin user already exists. Skipping initialization.');
            return;
        }

        console.log('⏳ Initializing admin user...');
        
        const admin = new User({
            name: 'Admin',
            email: adminEmail,
            phone: '9999999999',
            password: adminPass,
            city: 'Admin City',
            role: 'admin',
            isEmailVerified: true,
            isPhoneVerified: true
        });

        await admin.save();
        console.log('✅ Admin user created (a@gmail.com / 1234)');
    } catch (error) {
        console.error('❌ Admin initialization failed:', error.message);
    }
};

module.exports = initializeAdmin;
