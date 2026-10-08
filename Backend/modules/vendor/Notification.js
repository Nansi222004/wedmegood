const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    message: {
        type: String,
        required: [true, 'Please provide notification message']
    },
    type: {
        type: String,
        enum: ['Lead', 'Booking', 'Review', 'System'],
        default: 'System'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const PUSH_BY_TYPE = {
    Lead: { title: 'New Lead', link: '/vendor/leads' },
    Booking: { title: 'Booking Update', link: '/vendor/bookings' },
    Review: { title: 'New Review', link: '/vendor/reviews' },
    System: { title: 'Utsavo', link: '/vendor/notifications' }
};

notificationSchema.pre('save', function () {
    this.$locals.wasNew = this.isNew;
});

// Every newly created vendor notification is also delivered as a push notification
notificationSchema.post('save', function (doc) {
    if (!doc.$locals.wasNew) return;

    // Required lazily to avoid a require cycle (push.service -> models)
    const Vendor = require('./Vendor');
    const { sendPushToVendor } = require('../../services/push.service');
    const { title, link } = PUSH_BY_TYPE[doc.type] || PUSH_BY_TYPE.System;

    // Fire-and-forget: push delivery must never delay or fail the caller
    Vendor.findById(doc.vendorId).select('notifications').lean()
        .then((vendor) => {
            if (!vendor || vendor.notifications?.push === false) return null;
            return sendPushToVendor(doc.vendorId, {
                title,
                body: doc.message,
                link,
                data: { notificationId: doc._id.toString(), type: doc.type }
            });
        })
        .catch((err) => console.warn('Vendor push failed gracefully:', err.message));
});

module.exports =mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
