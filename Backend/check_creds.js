const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const Vendor = require('./modules/vendor/Vendor');
const User = require('./modules/user/user.model');

const check = async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/utsavo-chakra');

    const vendor = await Vendor.findOne({ email: 'vendor@utsavo.com' }).select('+password');
    console.log('Vendor Found:', vendor ? 'YES' : 'NO');
    if (vendor) {
        const isMatch = await vendor.matchPassword('password123');
        console.log('Vendor Password Match:', isMatch ? 'YES' : 'NO');
    }

    const user = await User.findOne({ email: 'customer@utsavo.com' }).select('+password');
    console.log('Customer Found:', user ? 'YES' : 'NO');
    if (user) {
        const isMatch = await user.comparePassword('password123');
        console.log('Customer Password Match:', isMatch ? 'YES' : 'NO');
    }

    process.exit(0);
};
check();
