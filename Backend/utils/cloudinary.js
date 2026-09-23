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
    storage: storage || multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

const path = require('path');
const fs = require('fs');

// Permitted MIME types and extensions for family group attachments
const ALLOWED_MIMES = [
    // Images
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif',
    // Videos
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/rtf'
];

const ALLOWED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.gif',
    '.mp4', '.mov', '.webm', '.avi',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.rtf'
];

const familyFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIMES.includes(mime)) {
        const error = new Error('Invalid file type. Only standard images, videos, and documents are permitted.');
        error.code = 'INVALID_FILE_TYPE';
        return cb(error, false);
    }
    cb(null, true);
};

// Family Group Private Storage
let familyStorage;
const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (hasCloudinary) {
    try {
        familyStorage = new CloudinaryStorage({
            cloudinary: cloudinary,
            params: async (req, file) => {
                const groupId = req.params.groupId || req.params.id || 'general';
                const isVideo = file.mimetype.startsWith('video/');
                const isDoc = !isVideo && !file.mimetype.startsWith('image/');
                const resourceType = isVideo ? 'video' : (isDoc ? 'raw' : 'image');

                return {
                    folder: `utsavo/family-groups/${groupId}`,
                    resource_type: resourceType,
                    // Use authenticated type for private family media
                    type: 'authenticated',
                    public_id: `${Date.now()}_${path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_\-]/g, '_')}`
                };
            }
        });
    } catch (err) {
        console.error('CLOUDINARY FAMILY STORAGE ERROR:', err.message);
    }
}

// Fallback disk storage for local development / testing without Cloudinary credentials
if (!familyStorage) {
    familyStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            const groupId = req.params.groupId || req.params.id || 'general';
            const uploadDir = path.join(__dirname, '../uploads/private/family-groups', String(groupId));
            fs.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, `${uniqueSuffix}${ext}`);
        }
    });
}

const familyUpload = multer({
    storage: familyStorage,
    fileFilter: familyFileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB hard ceiling
    }
});

/**
 * Generate a short-lived signed URL for an authenticated Cloudinary asset (1-hour validity)
 */
const getSignedAttachmentUrl = (publicId, resourceType = 'image', expiresInSeconds = 3600) => {
    if (!publicId || !hasCloudinary) return null;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return cloudinary.url(publicId, {
        sign_url: true,
        type: 'authenticated',
        resource_type: resourceType || 'image',
        expires_at: expiresAt,
        secure: true
    });
};

/**
 * Delete an uploaded asset from Cloudinary or local disk (Orphan Cleanup)
 */
const destroyFile = async ({ publicId, resourceType, storagePath }) => {
    try {
        if (publicId && hasCloudinary) {
            await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType || 'image',
                type: 'authenticated',
                invalidate: true
            });
        }
        if (storagePath && fs.existsSync(storagePath)) {
            await fs.promises.unlink(storagePath);
        }
    } catch (err) {
        console.error('Error destroying orphaned file:', err.message);
    }
};

module.exports = {
    cloudinary,
    upload,
    familyUpload,
    getSignedAttachmentUrl,
    destroyFile,
    ALLOWED_MIMES,
    ALLOWED_EXTENSIONS
};
