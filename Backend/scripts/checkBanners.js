const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Banner = require('../modules/admin/Banner');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkBanners = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const banners = await Banner.find();
        console.log('Total Banners in DB:', banners.length);
        console.log(JSON.stringify(banners, null, 2));
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkBanners();
