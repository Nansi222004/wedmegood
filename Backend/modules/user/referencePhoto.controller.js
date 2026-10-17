const mongoose = require('mongoose');
const ReferencePhoto = require('./ReferencePhoto');
const Lead = require('../vendor/Lead');
const { destroyFile } = require('../../utils/cloudinary');
const { streamPhoto } = require('../../services/referencePhoto.service');

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const urlFor = (id) => `/user/reference-photos/${id}`;

// @desc    Upload private reference photos (field "photos", up to 10)
// @route   POST /api/user/reference-photos
// @access  Private (User)
exports.uploadReferencePhotos = async (req, res, next) => {
    try {
        const files = req.files || [];
        if (files.length === 0) {
            return res.status(400).json({ success: false, message: 'Choose at least one photo' });
        }
        const docs = await ReferencePhoto.insertMany(files.map(f => {
            const onCloudinary = /^https?:\/\//.test(String(f.path || ''));
            return {
                userId: req.user._id,
                publicId: onCloudinary ? f.filename : null,
                storagePath: onCloudinary ? null : f.path,
                format: f.format || '',
                mimeType: f.mimetype || 'image/jpeg',
                bytes: f.size || f.bytes || 0
            };
        }));
        res.status(201).json({
            success: true,
            data: docs.map(d => ({ _id: d._id, url: urlFor(d._id) }))
        });
    } catch (err) {
        next(err);
    }
};

// @desc    The customer's own reference photo
// @route   GET /api/user/reference-photos/:id
// @access  Private (User, owner only)
exports.getReferencePhoto = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid photo' });
        const photo = await ReferencePhoto.findOne({ _id: req.params.id, userId: req.user._id }).lean();
        if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });
        await streamPhoto(res, photo, { width: 1600 });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a reference photo that is not attached to a requirement yet
// @route   DELETE /api/user/reference-photos/:id
// @access  Private (User, owner only)
exports.deleteReferencePhoto = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid photo' });
        const photo = await ReferencePhoto.findOne({ _id: req.params.id, userId: req.user._id });
        if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });
        if (await Lead.exists({ referencePhotoIds: photo._id })) {
            return res.status(400).json({ success: false, message: 'This photo is part of a requirement. Remove it from the requirement instead.' });
        }
        await destroyFile({ publicId: photo.publicId, resourceType: 'image', storagePath: photo.storagePath });
        await photo.deleteOne();
        res.status(200).json({ success: true, message: 'Photo removed' });
    } catch (err) {
        next(err);
    }
};

exports.photoUrlFor = urlFor;
