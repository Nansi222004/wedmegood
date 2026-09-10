const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('CLOUDINARY ERROR: Missing credentials in .env file. Media uploads will fail.');
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

// Configure Storage
let storage;
try {
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            return {
                folder: req.body.folder || 'utsavo/general',
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4'],
                resource_type: 'auto'
            };
        }
    });
} catch (error) {
    console.error('CLOUDINARY STORAGE ERROR:', error.message);
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = { cloudinary, upload };
