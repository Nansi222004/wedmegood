const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../modules/user/user.model');

const initializeAdmin = async () => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        // In production the admin credentials must be provided; a well-known default login
        // (a@gmail.com / 1234) on a live system would hand out full admin access.
        if (isProduction && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
            console.warn('⚠️ ADMIN_EMAIL / ADMIN_PASSWORD are not set; skipping admin auto-creation in production.');
            return;
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'a@gmail.com';
        const adminPass = process.env.ADMIN_PASSWORD || '1234';

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
        console.log(`✅ Admin user created (${adminEmail})`);
    } catch (error) {
        console.error('❌ Admin initialization failed:', error.message);
    }
};

module.exports = initializeAdmin;
